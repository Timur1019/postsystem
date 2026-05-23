package com.pos.security;

import java.util.Optional;

/**
 * Tenant (company) контекст текущего HTTP-запроса.
 */
public final class TenantContext {

    private static final ThreadLocal<Integer> COMPANY_ID = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> BYPASS_RLS = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void set(Integer companyId, boolean bypassRls) {
        if (companyId != null) {
            COMPANY_ID.set(companyId);
        } else {
            COMPANY_ID.remove();
        }
        BYPASS_RLS.set(bypassRls);
    }

    public static void clear() {
        COMPANY_ID.remove();
        BYPASS_RLS.remove();
    }

    public static Optional<Integer> companyId() {
        return Optional.ofNullable(COMPANY_ID.get());
    }

    public static boolean bypassRls() {
        return Boolean.TRUE.equals(BYPASS_RLS.get());
    }

    public static String cacheKeyPrefix() {
        return companyId().map(id -> "company:" + id).orElse("platform");
    }
}
