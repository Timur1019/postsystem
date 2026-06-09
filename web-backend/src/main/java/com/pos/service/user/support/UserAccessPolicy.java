package com.pos.service.user.support;

import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.repository.UserRepository;
import com.pos.repository.spec.UserSpecifications;
import com.pos.service.support.TenantAccessSupport;
import com.pos.service.support.UserLookupSupport;
import com.pos.util.UserLoginUtil;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserAccessPolicy {

    private final UserRepository userRepository;
    private final UserLookupSupport userLookup;
    private final TenantAccessSupport tenantAccess;

    public boolean canView(User user) {
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

    public Integer companyId(User user) {
        return user.getCompany() != null ? user.getCompany().getId() : null;
    }

    public User requireAccessible(UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> PosExceptions.notFound("User", id));
        if (!canView(user)) {
            throw PosExceptions.badRequest("Access denied");
        }
        return user;
    }

    public void assertRoleAllowedForCreate(String roleName) {
        if ("SUPER_ADMIN".equals(roleName)) {
            throw PosExceptions.badRequest("Cannot assign SUPER_ADMIN role");
        }
        if (tenantAccess.isSuperAdmin()) {
            return;
        }
        if (!List.of("ADMIN", "MANAGER", "CASHIER").contains(roleName)) {
            throw PosExceptions.badRequest("Invalid role for tenant admin");
        }
        if ("ADMIN".equals(roleName)) {
            throw PosExceptions.badRequest("Only platform admin can create company administrators");
        }
    }

    public Integer resolveCompanyIdForCreate(Integer requestedCompanyId, String roleName) {
        if ("ADMIN".equals(roleName) || "MANAGER".equals(roleName) || "CASHIER".equals(roleName)) {
            if (tenantAccess.isSuperAdmin()) {
                if (requestedCompanyId == null) {
                    throw PosExceptions.badRequest("Company is required for this role");
                }
                return requestedCompanyId;
            }
            User actor = tenantAccess.currentUser();
            if (actor.getCompany() == null) {
                throw PosExceptions.badRequest("Your account is not linked to a company");
            }
            return actor.getCompany().getId();
        }
        return null;
    }

    public void assertUsernameAvailable(Integer companyId, String username, UUID excludeUserId) {
        if (companyId == null) {
            if (userLookup.exists(
                UserSpecifications.lookup().platformOnly().usernameIgnoreCase(username).excludeId(excludeUserId)
            )) {
                throw PosExceptions.badRequest("Username already taken");
            }
            return;
        }
        if (userLookup.exists(
            UserSpecifications.lookup().tenantOnly().usernameIgnoreCase(username).excludeId(excludeUserId)
        )) {
            throw PosExceptions.badRequest("Username already taken");
        }
        if (userLookup.exists(
            UserSpecifications.lookup().platformOnly().usernameIgnoreCase(username).excludeId(excludeUserId)
        )) {
            throw PosExceptions.badRequest("Username already taken");
        }
    }

    public void assertEmailAvailable(Integer companyId, String email, UUID excludeUserId) {
        boolean taken = companyId == null
            ? userLookup.exists(
                UserSpecifications.lookup().platformOnly().emailIgnoreCase(email).excludeId(excludeUserId)
            )
            : userLookup.exists(
                UserSpecifications.lookup().companyId(companyId).emailIgnoreCase(email).excludeId(excludeUserId)
            );
        if (taken) {
            throw PosExceptions.badRequest("Email already registered in this company");
        }
    }

    public static void assertCashierStoreAssignment(String roleName, List<Integer> storeIds) {
        if (!"CASHIER".equalsIgnoreCase(roleName)) {
            return;
        }
        if (storeIds == null || storeIds.size() != 1) {
            throw PosExceptions.badRequest("Cashier must be assigned to exactly one store");
        }
    }

    public User loadForResponse(UUID id, User fallback) {
        return userRepository.findByIdWithDetails(id).orElseGet(() -> {
            Hibernate.initialize(fallback.getRole());
            if (fallback.getCompany() != null) {
                Hibernate.initialize(fallback.getCompany());
            }
            Hibernate.initialize(fallback.getStores());
            return fallback;
        });
    }
}
