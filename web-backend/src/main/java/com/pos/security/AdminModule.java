package com.pos.security;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/** Ключи модулей админки и кассы (синхрон с web-frontend moduleHandbook). */
public enum AdminModule {
    DASHBOARD("dashboard", "main", Set.of("ADMIN", "MANAGER")),
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
    REPORTS_SALES("reportsSales", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_SALES_BY_PRODUCTS("reportsSalesByProducts", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_RETURNS("reportsReturns", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_ANALYTICS("reportsAnalytics", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_DASHBOARD("reportsStockDashboard", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_WRITE_OFFS("reportsStockWriteOffs", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_LOW("reportsStockLow", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_TURNOVER("reportsStockTurnover", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_MOVEMENTS("reportsStockMovements", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_LIFECYCLE("reportsStockLifecycle", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_RECEIPTS("reportsStockReceipts", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_SALES_BY_CATEGORIES("reportsSalesByCategories", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_SALES_BY_STORES("reportsSalesByStores", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_SALES_PERIOD_COMPARE("reportsSalesPeriodCompare", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_SALES_DAILY("reportsSalesDaily", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_CASHIER_PERFORMANCE("reportsCashierPerformance", "reports", Set.of("ADMIN")),
    REPORTS_STOCK_BALANCES("reportsStockBalances", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_ADJUSTMENTS("reportsStockAdjustments", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_DEAD("reportsStockDead", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_INVENTORIES("reportsStockInventories", "reports", Set.of("ADMIN", "MANAGER")),
    REPORTS_STOCK_TRANSFERS("reportsStockTransfers", "reports", Set.of("ADMIN", "MANAGER")),
    STOCK_INVENTORIES("stockInventories", "stock", Set.of("ADMIN", "MANAGER")),
    STOCK_TRANSFERS("stockTransfers", "stock", Set.of("ADMIN", "MANAGER")),
    STORES("stores", "settings", Set.of("ADMIN")),
    USERS_LIST("usersList", "settings", Set.of("ADMIN")),
    USERS_PRINTER_SETTINGS("usersPrinterSettings", "settings", Set.of("ADMIN")),
    USERS_BRANDING_SETTINGS("usersBrandingSettings", "settings", Set.of("ADMIN")),
    USERS_BARCODE_PRINT("usersBarcodePrint", "settings", Set.of("ADMIN")),
    CHECKOUT("checkout", "main", Set.of("ADMIN", "MANAGER")),
    CASHIER_POS("cashierPos", "cashier", Set.of("CASHIER", "ADMIN", "MANAGER")),
    CASHIER_SALES("cashierSales", "cashier", Set.of("CASHIER", "ADMIN", "MANAGER"));

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
