package com.pos.security;

import com.pos.entity.User;
import com.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("tenantCacheKeyResolver")
@RequiredArgsConstructor
public class TenantCacheKeyResolver {

    private final CurrentUserProvider currentUserProvider;
    private final UserRepository userRepository;

    public String stores() {
        return TenantContext.cacheKeyPrefix() + ":stores";
    }

    public String categories() {
        return TenantContext.cacheKeyPrefix() + ":categories";
    }

    /** Для @CacheEvict когда нет HTTP-контекста (после create/update). */
    public String categoriesForCurrentUser() {
        try {
            User user = currentUserProvider.requireCurrentUser();
            if (currentUserProvider.isSuperAdmin(user)) {
                return TenantContext.companyId()
                    .map(id -> "company:" + id + ":categories")
                    .orElse("platform:categories");
            }
            if (user.getCompany() != null) {
                return "company:" + user.getCompany().getId() + ":categories";
            }
        } catch (Exception ignored) {
            // fallback
        }
        return TenantContext.cacheKeyPrefix() + ":categories";
    }

    public String storesForCurrentUser() {
        try {
            User user = currentUserProvider.requireCurrentUser();
            if (currentUserProvider.isSuperAdmin(user)) {
                return TenantContext.companyId()
                    .map(id -> "company:" + id + ":stores")
                    .orElse("platform:stores");
            }
            if (user.getCompany() != null) {
                return "company:" + user.getCompany().getId() + ":stores";
            }
        } catch (Exception ignored) {
            // fallback
        }
        return TenantContext.cacheKeyPrefix() + ":stores";
    }
}
