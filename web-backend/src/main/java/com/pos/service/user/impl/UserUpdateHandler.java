package com.pos.service.user.impl;

import com.pos.dto.user.UpdateUserRequest;
import com.pos.dto.user.UserResponse;
import com.pos.entity.Role;
import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.mapper.UserMapper;
import com.pos.repository.RoleRepository;
import com.pos.repository.UserRepository;
import com.pos.security.cache.AuthenticatedUserCache;
import com.pos.service.support.TenantAccessSupport;
import com.pos.service.user.UserPinService;
import com.pos.service.user.support.UserAccessPolicy;
import com.pos.util.DbExceptionTranslator;
import com.pos.util.LogUtil;
import com.pos.util.TextUtil;
import com.pos.util.UserLoginUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserUpdateHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantAccessSupport tenantAccess;
    private final UserAccessPolicy accessPolicy;
    private final UserPinService userPinService;
    private final UserMapper userMapper;
    private final AuthenticatedUserCache authenticatedUserCache;

    @Transactional(rollbackFor = Exception.class)
    public UserResponse update(UUID id, UpdateUserRequest req) {
        User user = accessPolicy.requireAccessible(id);
        applyChanges(user, req);
        LogUtil.info(UserUpdateHandler.class, "User updated: id={}", id);
        User saved = DbExceptionTranslator.persist(() -> userRepository.saveAndFlush(user));
        authenticatedUserCache.evict(saved.getId());
        return userMapper.toResponse(accessPolicy.loadForResponse(saved.getId(), saved));
    }

    private void applyChanges(User user, UpdateUserRequest req) {
        if (req.username() != null) {
            String username = UserLoginUtil.normalizeUsername(req.username());
            if (!StringUtils.hasText(username)) {
                throw PosExceptions.badRequest("Username is required");
            }
            Integer companyId = accessPolicy.companyId(user);
            if (!username.equalsIgnoreCase(user.getUsername())) {
                accessPolicy.assertUsernameAvailable(companyId, username, user.getId());
                user.setUsername(username);
            }
        }

        if (req.firstName() != null) {
            user.setFirstName(TextUtil.trimOrNull(req.firstName()));
        }
        if (req.lastName() != null) {
            user.setLastName(TextUtil.trimOrNull(req.lastName()));
        }
        if (req.patronymic() != null) {
            user.setPatronymic(TextUtil.trimOrNull(req.patronymic()));
        }
        if (req.fullName() != null && StringUtils.hasText(req.fullName())) {
            user.setFullName(req.fullName().trim());
        } else {
            user.syncFullName();
        }

        if (req.email() != null) {
            String email = UserLoginUtil.normalizeEmail(req.email());
            Integer companyId = accessPolicy.companyId(user);
            if (!email.equalsIgnoreCase(user.getEmail())) {
                accessPolicy.assertEmailAvailable(companyId, email, user.getId());
            }
            user.setEmail(email);
        }

        if (StringUtils.hasText(req.password())) {
            user.setPassword(passwordEncoder.encode(req.password().trim()));
            LogUtil.info(UserUpdateHandler.class, "User password changed: id={}", user.getId());
        }

        if (req.role() != null) {
            Role role = roleRepository.findByName(req.role())
                .orElseThrow(() -> PosExceptions.badRequest("Invalid role"));
            accessPolicy.assertRoleAllowedForCreate(role.getName());
            String oldRoleName = user.getRole().getName();
            userPinService.clearOnRoleChange(user, oldRoleName, role.getName(), req.pin());
            user.setRole(role);
        }

        if (req.pin() != null) {
            userPinService.applyForUpdate(user, accessPolicy.companyId(user), req.pin());
        }

        if (req.companyId() != null && tenantAccess.isSuperAdmin()) {
            user.setCompany(tenantAccess.requireCompany(req.companyId()));
        }

        if (req.storeIds() != null) {
            Integer companyId = accessPolicy.companyId(user);
            if (companyId == null) {
                throw PosExceptions.badRequest("Assign a company before selecting stores");
            }
            String roleName = req.role() != null ? req.role() : user.getRole().getName();
            UserAccessPolicy.assertCashierStoreAssignment(roleName, req.storeIds());
            user.setStores(new HashSet<>(tenantAccess.resolveStoresForUser(companyId, req.storeIds())));
        }
    }
}
