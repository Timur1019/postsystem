package com.pos.service.ai.impl;

public final class AiAssistantToolCatalog {

    public static final String TODAY_REVENUE = "todayRevenue";
    public static final String SALES_PERIOD = "salesPeriodOverview";
    public static final String TOP_PRODUCTS = "topProductsPeriod";
    public static final String RETURNS_SUMMARY = "returnsSummaryPeriod";
    public static final String REDISTRIBUTION = "stockRedistributionSuggestion";
    public static final String STORE_INSIGHT = "storeSalesAndStockInsight";
    public static final String INVENTORY = "inventoryOverview";
    public static final String Z_REPORTS = "zReportsOverview";
    public static final String BUSINESS_HEALTH = "businessHealthCheck";
    public static final String LOW_STOCK = "lowStockOverview";
    public static final String STOCK_TURNOVER = "stockTurnoverOverview";
    public static final String PRODUCT_SALES = "productSalesOverview";
    public static final String DEAD_STOCK = "deadStockOverview";
    public static final String PRODUCT_LIFECYCLE = "productLifecycleOverview";
    public static final String SMALLTALK = "smalltalk";

    private AiAssistantToolCatalog() {
    }

    public static boolean isAllowed(String tool) {
        return TODAY_REVENUE.equals(tool)
                || SALES_PERIOD.equals(tool)
                || TOP_PRODUCTS.equals(tool)
                || RETURNS_SUMMARY.equals(tool)
                || REDISTRIBUTION.equals(tool)
                || STORE_INSIGHT.equals(tool)
                || INVENTORY.equals(tool)
                || Z_REPORTS.equals(tool)
                || BUSINESS_HEALTH.equals(tool)
                || LOW_STOCK.equals(tool)
                || STOCK_TURNOVER.equals(tool)
                || PRODUCT_SALES.equals(tool)
                || DEAD_STOCK.equals(tool)
                || PRODUCT_LIFECYCLE.equals(tool)
                || SMALLTALK.equals(tool);
    }
}
