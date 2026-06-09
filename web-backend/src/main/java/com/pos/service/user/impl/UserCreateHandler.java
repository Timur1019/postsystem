package com.pos.service.user.impl;

import com.pos.dto.user.CreateUserRequest;
import com.pos.dto.user.UserResponse;
import com.pos.entity.Company;
import com.pos.entity.Role;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.mapper.UserMapper;
import com.pos.repository.RoleRepository;
import com.pos.repository.UserRepository;
import com.pos.service.email.EmailService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.service.user.UserPinService;
import com.pos.service.user.support.UserAccessPolicy;
import com.pos.util.DbExceptionTranslator;
import com.pos.util.LogUtil;
import com.pos.util.PersonNameUtil;
import com.pos.util.TextUtil;
import com.pos.util.UserLoginUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserCreateHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantAccessSupport tenantAccess;
    private final UserAccessPolicy accessPolicy;
    private final UserPinService userPinService;
    private final EmailService emailService;
    private final UserMapper userMapper;

    @Transactional(rollbackFor = Exception.class)
    public UserResponse create(CreateUserRequest req) {
        Role role = roleRepository.findByName(req.role())
            .orElseThrow(() -> PosExceptions.badRequest("Invalid role: " + req.role()));
        accessPolicy.assertRoleAllowedForCreate(role.getName());

        Integer companyId = accessPolicy.resolveCompanyIdForCreate(req.companyId(), role.getName());
        String username = UserLoginUtil.normalizeUsername(req.username());
        String email = UserLoginUtil.normalizeEmail(req.email());
        accessPolicy.assertUsernameAvailable(companyId, username, null);
        accessPolicy.assertEmailAvailable(companyId, email, null);

        Company company = companyId != null ? tenantAccess.requireCompany(companyId) : null;
        UserAccessPolicy.assertCashierStoreAssignment(role.getName(), req.storeIds());
        Set<Store> stores = companyId != null
            ? tenantAccess.resolveStoresForUser(companyId, req.storeIds())
            : Set.of();

        String rawPassword = resolvePasswordForCreate(role.getName(), req.password(), req.pin());
        User user = User.builder()
            .username(username)
            .email(email)
            .password(passwordEncoder.encode(rawPassword))
            .firstName(TextUtil.trimOrNull(req.firstName()))
            .lastName(TextUtil.trimOrNull(req.lastName()))
            .patronymic(TextUtil.trimOrNull(req.patronymic()))
            .fullName(resolveFullName(req))
            .role(role)
            .company(company)
            .stores(new HashSet<>(stores))
            .isActive(true)
            .build();
        user.syncFullName();
        userPinService.applyForCreate(user, role.getName(), companyId, req.pin());

        User saved = DbExceptionTranslator.persist(() -> userRepository.saveAndFlush(user));
        emailService.sendUserCredentials(accessPolicy.loadForResponse(saved.getId(), saved), rawPassword);
        LogUtil.info(UserCreateHandler.class, "User created: id={}, username={}", saved.getId(), saved.getUsername());
        return userMapper.toResponse(accessPolicy.loadForResponse(saved.getId(), saved));
    }

    private static String resolveFullName(CreateUserRequest req) {
        String built = PersonNameUtil.buildFullName(req.lastName(), req.firstName(), req.patronymic());
        if (StringUtils.hasText(built)) {
            return built;
        }
        if (StringUtils.hasText(req.fullName())) {
            return req.fullName().trim();
        }
        throw PosExceptions.badRequest("Full name or FIO is required");
    }

    private static String resolvePasswordForCreate(String roleName, String password, String pin) {
        if ("CASHIER".equalsIgnoreCase(roleName)) {
            if (StringUtils.hasText(password) && password.trim().length() >= 6) {
                return password.trim();
            }
            return UUID.randomUUID() + "Aa1!";
        }
        if (!StringUtils.hasText(password) || password.trim().length() < 6) {
            throw PosExceptions.badRequest("Password must be at least 6 characters");
        }
        return password.trim();
    }
}
