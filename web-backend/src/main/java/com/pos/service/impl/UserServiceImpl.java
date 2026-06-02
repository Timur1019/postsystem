package com.pos.service.impl;

import com.pos.dto.user.CreateUserRequest;
import com.pos.dto.user.UpdateUserRequest;
import com.pos.dto.user.UserResponse;
import com.pos.entity.Company;
import com.pos.entity.Role;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ConflictException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.UserMapper;
import com.pos.repository.RoleRepository;
import com.pos.repository.UserRepository;
import com.pos.service.UserService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.LogUtil;
import com.pos.util.CashierPinUtil;
import com.pos.util.PersonNameUtil;
import com.pos.util.UserLoginUtil;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.pos.util.DbExceptionTranslator;
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
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantAccessSupport tenantAccess;
    private final UserMapper userMapper;
    @Value("${app.jwt.secret}")
    private String pinSecret;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        if (tenantAccess.isSuperAdmin()) {
            return userRepository.findAllWithDetails().stream()
                .filter(this::canView)
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
        }
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        return userRepository.findByCompanyIdWithDetails(companyId).stream()
            .filter(this::canView)
            .map(userMapper::toResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findById(UUID id) {
        User user = requireAccessibleUser(id);
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserResponse create(CreateUserRequest req) {
        try {
            Role role = roleRepository.findByName(req.role())
                .orElseThrow(() -> new BadRequestException("Invalid role: " + req.role()));
            assertRoleAllowedForCreate(role.getName());

            Integer companyId = resolveCompanyIdForUser(req.companyId(), role.getName());
            String username = UserLoginUtil.normalizeUsername(req.username());
            String email = UserLoginUtil.normalizeEmail(req.email());
            assertUsernameAvailable(companyId, username, null);
            assertEmailAvailable(companyId, email, null);

            Company company = companyId != null ? tenantAccess.requireCompany(companyId) : null;
            assertCashierStoreAssignment(role.getName(), req.storeIds());
            Set<Store> stores = companyId != null
                ? tenantAccess.resolveStoresForUser(companyId, req.storeIds())
                : Set.of();

            String rawPassword = resolvePasswordForCreate(role.getName(), req.password(), req.pin());

            User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
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
            applyCashierPinForCreate(user, role.getName(), companyId, req.pin());

            User saved = userRepository.saveAndFlush(user);
            LogUtil.info(UserServiceImpl.class, "User created: id={}, username={}", saved.getId(), saved.getUsername());
            return userMapper.toResponse(loadUserForResponse(saved.getId(), saved));
        } catch (BadRequestException | ConflictException ex) {
            throw ex;
        } catch (DataAccessException ex) {
            LogUtil.warn(UserServiceImpl.class, "User create DB error: {}", DbExceptionTranslator.rootCauseMessage(ex));
            throw DbExceptionTranslator.toClientException(ex);
        } catch (RuntimeException ex) {
            LogUtil.warn(UserServiceImpl.class, "User create failed: {}", DbExceptionTranslator.rootCauseMessage(ex));
            throw DbExceptionTranslator.toClientException(ex);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserResponse update(UUID id, UpdateUserRequest req) {
        User user = requireAccessibleUser(id);

        if (req.username() != null) {
            String username = UserLoginUtil.normalizeUsername(req.username());
            if (!StringUtils.hasText(username)) {
                throw new BadRequestException("Username is required");
            }
            Integer companyId = user.getCompany() != null ? user.getCompany().getId() : null;
            if (!username.equalsIgnoreCase(user.getUsername())) {
                assertUsernameAvailable(companyId, username, user.getId());
                user.setUsername(username);
            }
        }

        if (req.firstName() != null) user.setFirstName(trimOrNull(req.firstName()));
        if (req.lastName() != null) user.setLastName(trimOrNull(req.lastName()));
        if (req.patronymic() != null) user.setPatronymic(trimOrNull(req.patronymic()));
        if (req.fullName() != null && StringUtils.hasText(req.fullName())) {
            user.setFullName(req.fullName().trim());
        } else {
            user.syncFullName();
        }

        if (req.email() != null) {
            String email = UserLoginUtil.normalizeEmail(req.email());
            Integer companyId = user.getCompany() != null ? user.getCompany().getId() : null;
            if (!email.equalsIgnoreCase(user.getEmail())) {
                assertEmailAvailable(companyId, email, user.getId());
            }
            user.setEmail(email);
        }

        if (StringUtils.hasText(req.password())) {
            user.setPassword(passwordEncoder.encode(req.password().trim()));
            LogUtil.info(UserServiceImpl.class, "User password changed: id={}", id);
        }

        if (req.role() != null) {
            Role role = roleRepository.findByName(req.role())
                .orElseThrow(() -> new BadRequestException("Invalid role"));
            assertRoleAllowedForCreate(role.getName());
            String oldRoleName = user.getRole().getName();
            String newRoleName = role.getName();
            if (!oldRoleName.equals(newRoleName)) {
                if ("CASHIER".equals(oldRoleName) && !"CASHIER".equals(newRoleName)) {
                    user.setPinDigest(null);
                }
                if ("CASHIER".equals(newRoleName) && !"CASHIER".equals(oldRoleName)
                    && !StringUtils.hasText(req.pin())) {
                    throw new BadRequestException("Cashier PIN is required when assigning CASHIER role");
                }
            }
            user.setRole(role);
        }

        if (req.pin() != null) {
            Integer companyId = user.getCompany() != null ? user.getCompany().getId() : null;
            applyCashierPinForUpdate(user, companyId, req.pin());
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
        try {
            User saved = userRepository.saveAndFlush(user);
            return userMapper.toResponse(loadUserForResponse(saved.getId(), saved));
        } catch (BadRequestException | ConflictException ex) {
            throw ex;
        } catch (DataAccessException ex) {
            throw DbExceptionTranslator.toClientException(ex);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserResponse toggleActive(UUID id) {
        User user = requireAccessibleUser(id);
        if ("SUPER_ADMIN".equals(user.getRole().getName())) {
            throw new BadRequestException("Cannot deactivate super administrator");
        }
        user.setActive(!user.isActive());
        try {
            User saved = userRepository.saveAndFlush(user);
            LogUtil.info(UserServiceImpl.class, "User active toggled: id={}, active={}", id, saved.isActive());
            return userMapper.toResponse(loadUserForResponse(saved.getId(), saved));
        } catch (BadRequestException | ConflictException ex) {
            throw ex;
        } catch (DataAccessException ex) {
            throw DbExceptionTranslator.toClientException(ex);
        }
    }

    private User loadUserForResponse(UUID id, User fallback) {
        return userRepository.findByIdWithDetails(id).orElseGet(() -> {
            Hibernate.initialize(fallback.getRole());
            if (fallback.getCompany() != null) {
                Hibernate.initialize(fallback.getCompany());
            }
            Hibernate.initialize(fallback.getStores());
            return fallback;
        });
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

    private static String resolvePasswordForCreate(String roleName, String password, String pin) {
        if ("CASHIER".equalsIgnoreCase(roleName)) {
            if (StringUtils.hasText(password) && password.trim().length() >= 6) {
                return password.trim();
            }
            return UUID.randomUUID() + "Aa1!";
        }
        if (!StringUtils.hasText(password) || password.trim().length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters");
        }
        return password.trim();
    }

    private static void assertCashierStoreAssignment(String roleName, List<Integer> storeIds) {
        if (!"CASHIER".equalsIgnoreCase(roleName)) {
            return;
        }
        if (storeIds == null || storeIds.size() != 1) {
            throw new BadRequestException("Cashier must be assigned to exactly one store");
        }
    }

    private void assertUsernameAvailable(Integer companyId, String username, UUID excludeUserId) {
        if (companyId == null) {
            if (userRepository.existsPlatformUsernameIgnoreCase(username, excludeUserId)) {
                throw new BadRequestException("Username already taken");
            }
            return;
        }
        if (userRepository.existsTenantUsernameIgnoreCase(username, excludeUserId)) {
            throw new BadRequestException("Username already taken");
        }
        if (userRepository.existsPlatformUsernameIgnoreCase(username, excludeUserId)) {
            throw new BadRequestException("Username already taken");
        }
    }

    private void assertEmailAvailable(Integer companyId, String email, UUID excludeUserId) {
        boolean taken = companyId == null
            ? userRepository.existsPlatformEmailIgnoreCase(email, excludeUserId)
            : userRepository.existsByCompanyIdAndEmailIgnoreCase(companyId, email, excludeUserId);
        if (taken) {
            throw new BadRequestException("Email already registered in this company");
        }
    }

    private void applyCashierPinForCreate(User user, String roleName, Integer companyId, String pin) {
        if (!"CASHIER".equalsIgnoreCase(roleName)) {
            return;
        }
        if (companyId == null) {
            throw new BadRequestException("Company is required for cashier");
        }
        String normalized = CashierPinUtil.normalizePin(pin);
        if (normalized.length() < 4 || normalized.length() > 6) {
            throw new BadRequestException("Cashier PIN must be 4-6 digits");
        }
        String digest = CashierPinUtil.digestHex(normalized, pinSecret);
        if (userRepository.existsByCompanyIdAndPinDigest(companyId, digest, null)) {
            throw new BadRequestException("PIN already used in this company");
        }
        user.setPinDigest(digest);
    }

    private void applyCashierPinForUpdate(User user, Integer companyId, String pin) {
        if (!"CASHIER".equalsIgnoreCase(user.getRole().getName())) {
            throw new BadRequestException("PIN can only be set for cashier");
        }
        if (companyId == null) {
            throw new BadRequestException("Company is required for cashier");
        }
        String normalized = CashierPinUtil.normalizePin(pin);
        if (normalized.length() < 4 || normalized.length() > 6) {
            throw new BadRequestException("Cashier PIN must be 4-6 digits");
        }
        String digest = CashierPinUtil.digestHex(normalized, pinSecret);
        if (userRepository.existsByCompanyIdAndPinDigest(companyId, digest, user.getId())) {
            throw new BadRequestException("PIN already used in this company");
        }
        user.setPinDigest(digest);
    }
}
