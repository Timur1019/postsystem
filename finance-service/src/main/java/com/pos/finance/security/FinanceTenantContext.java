package com.pos.finance.security;

import com.pos.finance.exception.FinanceExceptions;

import java.util.Optional;
import java.util.UUID;

public final class FinanceTenantContext {

    private static final ThreadLocal<Integer> COMPANY_ID = new ThreadLocal<>();
    private static final ThreadLocal<UUID> USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> ROLE = new ThreadLocal<>();

    private FinanceTenantContext() {
    }

    public static void set(Integer companyId, UUID userId, String role) {
        COMPANY_ID.set(companyId);
        USER_ID.set(userId);
        ROLE.set(role);
    }

    public static void clear() {
        COMPANY_ID.remove();
        USER_ID.remove();
        ROLE.remove();
    }

    public static Integer requireCompanyId() {
        return companyId().orElseThrow(() -> FinanceExceptions.badRequest("Не указана компания в контексте запроса"));
    }

    public static Optional<Integer> companyId() {
        return Optional.ofNullable(COMPANY_ID.get());
    }

    public static Optional<UUID> userId() {
        return Optional.ofNullable(USER_ID.get());
    }

    public static Optional<String> role() {
        return Optional.ofNullable(ROLE.get());
    }

    public static boolean isFinanceAdmin() {
        String role = ROLE.get();
        return "ADMIN".equals(role) || "SUPER_ADMIN".equals(role);
    }
}
