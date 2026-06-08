package com.pos.service.impl;

import com.pos.dto.access.AdminModuleCatalogItem;
import com.pos.dto.access.UpdateUserModuleAccessRequest;
import com.pos.dto.access.UserModuleAccessDetailResponse;
import com.pos.dto.access.UserModuleAccessRow;
import com.pos.dto.access.UserModuleAccessSummary;
import com.pos.entity.User;
import com.pos.entity.UserModuleAccess;
import com.pos.entity.UserModuleAccessId;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.UserModuleAccessRepository;
import com.pos.repository.UserRepository;
import com.pos.security.AdminModule;
import com.pos.service.ModuleAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ModuleAccessServiceImpl implements ModuleAccessService {

    private final UserRepository userRepository;
    private final UserModuleAccessRepository userModuleAccessRepository;

    @Override
    public List<AdminModuleCatalogItem> catalog() {
        return Arrays.stream(AdminModule.values())
            .map(m -> new AdminModuleCatalogItem(m.key(), m.group()))
            .toList();
    }

    @Override
    public List<UserModuleAccessSummary> listUsers(Integer companyId) {
        return userRepository.findByCompanyIdWithDetails(companyId).stream()
            .map(this::toSummary)
            .toList();
    }

    @Override
    public UserModuleAccessDetailResponse getUserAccess(UUID userId) {
        User user = requireTenantUser(userId);
        return buildDetail(user);
    }

    @Override
    @Transactional(readOnly = false)
    public UserModuleAccessDetailResponse updateUserAccess(UUID userId, UpdateUserModuleAccessRequest request) {
        User user = requireTenantUser(userId);
        if (Boolean.FALSE.equals(request.customAccess())) {
            return resetUserAccess(userId);
        }

        Map<String, Boolean> modules = request.modules() != null ? request.modules() : Map.of();
        userModuleAccessRepository.deleteByUserId(userId);

        List<UserModuleAccess> rows = new ArrayList<>();
        boolean anyAllowed = false;
        for (AdminModule module : modulesForUserRole(user)) {
            boolean allowed = Boolean.TRUE.equals(modules.get(module.key()));
            if (allowed) {
                anyAllowed = true;
            }
            rows.add(UserModuleAccess.builder()
                .id(new UserModuleAccessId(userId, module.key()))
                .user(user)
                .allowed(allowed)
                .build());
        }
        if (!anyAllowed) {
            throw new BadRequestException("Включите хотя бы один модуль");
        }
        userModuleAccessRepository.saveAll(rows);
        user.setModuleAccessCustom(true);
        userRepository.save(user);
        return buildDetail(userRepository.findById(userId).orElseThrow());
    }

    @Override
    @Transactional(readOnly = false)
    public UserModuleAccessDetailResponse resetUserAccess(UUID userId) {
        User user = requireTenantUser(userId);
        userModuleAccessRepository.deleteByUserId(userId);
        user.setModuleAccessCustom(false);
        userRepository.save(user);
        return buildDetail(user);
    }

    @Override
    public List<String> resolveAllowedModuleIds(User user) {
        if (user == null || user.getRole() == null) {
            return List.of();
        }
        String role = user.getRole().getName();
        if ("SUPER_ADMIN".equals(role)) {
            return AdminModule.adminScope().stream().map(AdminModule::key).sorted().toList();
        }

        List<AdminModule> scope = modulesForUserRole(user);
        if (!user.isModuleAccessCustom()) {
            return scope.stream()
                .filter(m -> m.allowedForRole(role))
                .map(AdminModule::key)
                .sorted()
                .toList();
        }

        Map<String, Boolean> stored = userModuleAccessRepository.findByUserId(user.getId()).stream()
            .collect(Collectors.toMap(UserModuleAccess::getModuleKey, UserModuleAccess::isAllowed, (a, b) -> b));

        return scope.stream()
            .filter(m -> moduleAllowedForCustomAccess(m, role, stored))
            .map(AdminModule::key)
            .sorted()
            .toList();
    }

    /**
     * Для кастомного доступа: явно сохранённые ключи — как в БД;
     * новые модули (ещё нет строки в user_module_access) — по умолчанию как у роли.
     */
    private boolean moduleAllowedForCustomAccess(
        AdminModule module,
        String role,
        Map<String, Boolean> stored
    ) {
        if (!stored.containsKey(module.key())) {
            return module.allowedForRole(role);
        }
        return Boolean.TRUE.equals(stored.get(module.key()));
    }

    private UserModuleAccessDetailResponse buildDetail(User user) {
        String role = user.getRole().getName();
        List<AdminModule> scope = modulesForUserRole(user);
        Map<String, Boolean> stored = user.isModuleAccessCustom()
            ? userModuleAccessRepository.findByUserId(user.getId()).stream()
                .collect(Collectors.toMap(UserModuleAccess::getModuleKey, UserModuleAccess::isAllowed, (a, b) -> b))
            : Map.of();

        List<UserModuleAccessRow> rows = scope.stream()
            .map(m -> {
                boolean roleDefault = m.allowedForRole(role);
                boolean allowed = user.isModuleAccessCustom()
                    ? moduleAllowedForCustomAccess(m, role, stored)
                    : roleDefault;
                return new UserModuleAccessRow(m.key(), allowed, roleDefault);
            })
            .toList();

        return new UserModuleAccessDetailResponse(
            user.getId(),
            user.getUsername(),
            user.getFullName(),
            role,
            user.isModuleAccessCustom(),
            rows
        );
    }

    private List<AdminModule> modulesForUserRole(User user) {
        String role = user.getRole().getName();
        if ("CASHIER".equals(role)) {
            return AdminModule.cashierScope();
        }
        return AdminModule.adminScope();
    }

    private User requireTenantUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == null || "SUPER_ADMIN".equals(user.getRole().getName())) {
            throw new BadRequestException("Module access is not configurable for this user");
        }
        if (user.getCompany() == null) {
            throw new BadRequestException("User has no company");
        }
        return user;
    }

    private UserModuleAccessSummary toSummary(User user) {
        return new UserModuleAccessSummary(
            user.getId(),
            user.getUsername(),
            user.getFullName(),
            user.getRole().getName(),
            user.getCompany() != null ? user.getCompany().getId() : null,
            user.getCompany() != null ? user.getCompany().getName() : null,
            user.isModuleAccessCustom()
        );
    }
}
