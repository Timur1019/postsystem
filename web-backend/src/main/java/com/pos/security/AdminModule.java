package com.pos.security;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/** Ключи модулей админки и кассы (синхрон с web-frontend moduleHandbook). */
public enum AdminModule {
    DASHBOARD("dashboard", "main", Set.of("ADMIN", "MANAGER")),
    AI_ASSISTANT("aiAssistant", "main", Set.of("ADMIN")),
    PRODUCTS("products", "goods", Set.of("ADMIN", "MANAGER")),
    CATEGORIES("categories", "goods", Set.of("ADMIN", "MANAGER")),
    STOCK_PRODUCTS("stockProducts", "stock", Set.of("ADMIN", "MANAGER")),
    STOCK_SUPPLIERS("stockSuppliers", "stock", Set.of("ADMIN", "MANAGER")),
    STOCK_RECEIPTS("stockReceipts", "stock", Set.of("ADMIN", "MANAGER")),
    ORDERS_LIST("ordersList", "orders", Set.of("ADMIN", "MANAGER")),
    REGISTERS_LIST("registersList", "registers", Set.of("ADMIN", "MANAGER")),
    REGISTERS_Z_REPORTS("registersZReports", "registers", Set.of("ADMIN", "MANAGER")),
    REGISTERS_TRANSFER("registersTransfer", "registers", Set.of("ADMIN", "MANAGER")),
    REGISTERS_CONFIG("registersConfig", "registers", Set.of("ADMIN", "MANAGER")),
    REPORTS_SALES("reportsSales", "reportsSales", Set.of("ADMIN", "MANAGER")),
    REPORTS_SALES_BY_PRODUCTS("reportsSalesByProducts", "reportsSales", Set.of("ADMIN", "MANAGER")),
    REPORTS_RETURNS("reportsReturns", "reportsSales", Set.of("ADMIN", "MANAGER")),
    REPORTS_ANALYTICS("reportsAnalytics", "reportsSales", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_DASHBOARD("reportsStockDashboard", "reportsStock", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_WRITE_OFFS("reportsStockWriteOffs", "reportsStock", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_LOW("reportsStockLow", "reportsStock", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_TURNOVER("reportsStockTurnover", "reportsStock", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_MOVEMENTS("reportsStockMovements", "reportsStock", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_LIFECYCLE("reportsStockLifecycle", "reportsStock", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_RECEIPTS("reportsStockReceipts", "reportsStock", Set.of("ADMIN", "MANAGER")),
    REPORTS_SALES_BY_CATEGORIES("reportsSalesByCategories", "reportsSales", Set.of("ADMIN", "MANAGER")),
    REPORTS_SALES_BY_STORES("reportsSalesByStores", "reportsSales", Set.of("ADMIN", "MANAGER")),
    REPORTS_SALES_PERIOD_COMPARE("reportsSalesPeriodCompare", "reportsSales", Set.of("ADMIN", "MANAGER")),
    REPORTS_SALES_DAILY("reportsSalesDaily", "reportsSales", Set.of("ADMIN", "MANAGER")),
    REPORTS_CASHIER_PERFORMANCE("reportsCashierPerformance", "reportsSales", Set.of("ADMIN")),
    REPORTS_STOCK_BALANCES("reportsStockBalances", "reportsStock", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_ADJUSTMENTS("reportsStockAdjustments", "reportsStock", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_DEAD("reportsStockDead", "reportsStock", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_INVENTORIES("reportsStockInventories", "reportsStock", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_TRANSFERS("reportsStockTransfers", "reportsStock", Set.of("ADMIN", "MANAGER")),
    STOCK_INVENTORIES("stockInventories", "stock", Set.of("ADMIN", "MANAGER")),
    STOCK_TRANSFERS("stockTransfers", "stock", Set.of("ADMIN", "MANAGER")),
    STORES("stores", "settings", Set.of("ADMIN")),
    USERS_LIST("usersList", "settings", Set.of("ADMIN")),
    USERS_PRINTER_SETTINGS("usersPrinterSettings", "settings", Set.of("ADMIN")),
    USERS_BRANDING_SETTINGS("usersBrandingSettings", "settings", Set.of("ADMIN")),
    USERS_BARCODE_PRINT("usersBarcodePrint", "settings", Set.of("ADMIN", "MANAGER")),
    CHECKOUT("checkout", "main", Set.of("ADMIN", "MANAGER")),
    CASHIER_POS("cashierPos", "cashier", Set.of("CASHIER", "ADMIN", "MANAGER")),
    CASHIER_SALES("cashierSales", "cashier", Set.of("CASHIER", "ADMIN", "MANAGER")),
    /** Офлайн-режим на desktop-кассе; по умолчанию никому — только через SUPER_ADMIN. */
    CASHIER_OFFLINE("cashierOffline", "cashier", Set.of()),
    FINANCE_DASHBOARD("financeDashboard", "finance", Set.of("ADMIN", "MANAGER")),
    FINANCE_DEBTS("financeDebts", "finance", Set.of("ADMIN", "MANAGER")),
    FINANCE_INCOMES("financeIncomes", "finance", Set.of("ADMIN", "MANAGER")),
    FINANCE_EXPENSES("financeExpenses", "finance", Set.of("ADMIN", "MANAGER")),
    FINANCE_ACCOUNTS("financeAccounts", "finance", Set.of("ADMIN", "MANAGER")),
    FINANCE_TRANSFERS("financeTransfers", "finance", Set.of("ADMIN", "MANAGER")),
    FINANCE_REPORTS("financeReports", "finance", Set.of("ADMIN", "MANAGER")),
    FINANCE_AUDIT("financeAudit", "finance", Set.of("ADMIN", "MANAGER")),
    FINANCE_CATEGORIES("financeCategories", "finance", Set.of("ADMIN"));

    private final String key;
    private final String group;
    private final Set<String> defaultRoles;

    AdminModule(String key, String group, Set<String> defaultRoles) {
        this.key = key;
        this.group = group;
        this.defaultRoles = defaultRoles;
    }

    public String key() {
        return key;
    }

    public String group() {
        return group;
    }

    public boolean allowedForRole(String roleName) {
        return roleName != null && defaultRoles.contains(roleName);
    }

    public static AdminModule fromKey(String key) {
        if (key == null || key.isBlank()) {
            return null;
        }
        for (AdminModule m : values()) {
            if (m.key.equals(key)) {
                return m;
            }
        }
        return null;
    }

    public static List<AdminModule> forRole(String roleName) {
        return Arrays.stream(values())
            .filter(m -> m.allowedForRole(roleName))
            .toList();
    }

    public static List<AdminModule> adminScope() {
        return Arrays.stream(values())
            .filter(m -> !"cashier".equals(m.group))
            .toList();
    }

    public static List<AdminModule> cashierScope() {
        return Arrays.stream(values())
            .filter(m -> "cashier".equals(m.group))
            .toList();
    }

    public static Set<String> defaultKeysForRole(String roleName) {
        return forRole(roleName).stream().map(AdminModule::key).collect(Collectors.toSet());
    }
}
