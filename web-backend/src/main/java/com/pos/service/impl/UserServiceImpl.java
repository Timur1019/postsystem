package com.pos.service.impl;

import com.pos.dto.user.CreateUserRequest;
import com.pos.dto.user.UpdateUserRequest;
import com.pos.dto.user.UserResponse;
import com.pos.entity.Company;
import com.pos.entity.Role;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.UserMapper;
import com.pos.repository.RoleRepository;
import com.pos.repository.UserRepository;
import com.pos.service.UserService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.LogUtil;
import com.pos.util.PersonNameUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantAccessSupport tenantAccess;
    private final UserMapper userMapper;

    @Override
    public List<UserResponse> findAll() {
        return userRepository.findAllWithDetails().stream()
            .filter(this::canView)
            .map(userMapper::toResponse)
            .collect(Collectors.toList());
    }

    @Override
    public UserResponse findById(UUID id) {
        User user = requireAccessibleUser(id);
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse create(CreateUserRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new BadRequestException("Username already taken");
        }
        if (userRepository.existsByEmail(req.email())) {
            throw new BadRequestException("Email already registered");
        }

        Role role = roleRepository.findByName(req.role())
            .orElseThrow(() -> new BadRequestException("Invalid role: " + req.role()));
        assertRoleAllowedForCreate(role.getName());

        Integer companyId = resolveCompanyIdForUser(req.companyId(), role.getName());
        Company company = companyId != null ? tenantAccess.requireCompany(companyId) : null;
        assertCashierStoreAssignment(role.getName(), req.storeIds());
        Set<Store> stores = companyId != null
            ? tenantAccess.resolveStoresForUser(companyId, req.storeIds())
            : Set.of();

        User user = User.builder()
            .username(req.username().trim())
            .email(req.email().trim())
            .password(passwordEncoder.encode(req.password()))
            .firstName(trimOrNull(req.firstName()))
            .lastName(trimOrNull(req.lastName()))
            .patronymic(trimOrNull(req.patronymic()))
            .fullName(resolveFullName(req))
            .role(role)
            .company(company)
            .stores(new HashSet<>(stores))
            .isActive(true)
            .build();
        user.syncFullName();

        User saved = userRepository.save(user);
        LogUtil.info(UserServiceImpl.class, "User created: id={}, username={}", saved.getId(), saved.getUsername());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest req) {
        User user = requireAccessibleUser(id);

        if (req.firstName() != null) user.setFirstName(trimOrNull(req.firstName()));
        if (req.lastName() != null) user.setLastName(trimOrNull(req.lastName()));
        if (req.patronymic() != null) user.setPatronymic(trimOrNull(req.patronymic()));
        if (req.fullName() != null && StringUtils.hasText(req.fullName())) {
            user.setFullName(req.fullName().trim());
        } else {
            user.syncFullName();
        }

        if (req.email() != null) {
            if (!req.email().equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(req.email())) {
                throw new BadRequestException("Email already registered");
            }
            user.setEmail(req.email().trim());
        }

        if (StringUtils.hasText(req.password())) {
            user.setPassword(passwordEncoder.encode(req.password().trim()));
            LogUtil.info(UserServiceImpl.class, "User password changed: id={}", id);
        }

        if (req.role() != null) {
            Role role = roleRepository.findByName(req.role())
                .orElseThrow(() -> new BadRequestException("Invalid role"));
            assertRoleAllowedForCreate(role.getName());
            user.setRole(role);
        }

        if (req.companyId() != null && tenantAccess.isSuperAdmin()) {
            user.setCompany(tenantAccess.requireCompany(req.companyId()));
        }

        if (req.storeIds() != null) {
            Integer companyId = user.getCompany() != null ? user.getCompany().getId() : null;
            if (companyId == null) {
                throw new BadRequestException("Assign a company before selecting stores");
            }
            String roleName = req.role() != null ? req.role() : user.getRole().getName();
            assertCashierStoreAssignment(roleName, req.storeIds());
            user.setStores(new HashSet<>(tenantAccess.resolveStoresForUser(companyId, req.storeIds())));
        }

        LogUtil.info(UserServiceImpl.class, "User updated: id={}", id);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse toggleActive(UUID id) {
        User user = requireAccessibleUser(id);
        if ("SUPER_ADMIN".equals(user.getRole().getName())) {
            throw new BadRequestException("Cannot deactivate super administrator");
        }
        user.setActive(!user.isActive());
        User saved = userRepository.save(user);
        LogUtil.info(UserServiceImpl.class, "User active toggled: id={}, active={}", id, saved.isActive());
        return userMapper.toResponse(saved);
    }

    private boolean canView(User user) {
        if ("SUPER_ADMIN".equals(user.getRole().getName()) && !tenantAccess.isSuperAdmin()) {
            return false;
        }
        if (tenantAccess.isSuperAdmin()) {
            return true;
        }
        User actor = tenantAccess.currentUser();
        if (actor.getCompany() == null) {
            return false;
        }
        return user.getCompany() != null && actor.getCompany().getId().equals(user.getCompany().getId());
    }

    private User requireAccessibleUser(UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!canView(user)) {
            throw new BadRequestException("Access denied");
        }
        return user;
    }

    private void assertRoleAllowedForCreate(String roleName) {
        if ("SUPER_ADMIN".equals(roleName)) {
            throw new BadRequestException("Cannot assign SUPER_ADMIN role");
        }
        if (tenantAccess.isSuperAdmin()) {
            return;
        }
        if (!List.of("ADMIN", "MANAGER", "CASHIER").contains(roleName)) {
            throw new BadRequestException("Invalid role for tenant admin");
        }
        if ("ADMIN".equals(roleName) && !tenantAccess.isSuperAdmin()) {
            throw new BadRequestException("Only platform admin can create company administrators");
        }
    }

    private Integer resolveCompanyIdForUser(Integer requestedCompanyId, String roleName) {
        if ("ADMIN".equals(roleName) || "MANAGER".equals(roleName) || "CASHIER".equals(roleName)) {
            if (tenantAccess.isSuperAdmin()) {
                if (requestedCompanyId == null) {
                    throw new BadRequestException("Company is required for this role");
                }
                return requestedCompanyId;
            }
            User actor = tenantAccess.currentUser();
            if (actor.getCompany() == null) {
                throw new BadRequestException("Your account is not linked to a company");
            }
            return actor.getCompany().getId();
        }
        return null;
    }

    private String resolveFullName(CreateUserRequest req) {
        String built = PersonNameUtil.buildFullName(req.lastName(), req.firstName(), req.patronymic());
        if (StringUtils.hasText(built)) {
            return built;
        }
        if (StringUtils.hasText(req.fullName())) {
            return req.fullName().trim();
        }
        throw new BadRequestException("Full name or FIO is required");
    }

    private static String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) return null;
        return value.trim();
    }

    private static void assertCashierStoreAssignment(String roleName, List<Integer> storeIds) {
        if (!"CASHIER".equalsIgnoreCase(roleName)) {
            return;
        }
        if (storeIds == null || storeIds.size() != 1) {
            throw new BadRequestException("Cashier must be assigned to exactly one store");
        }
    }
}
