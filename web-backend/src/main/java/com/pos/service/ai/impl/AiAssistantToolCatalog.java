package com.pos.service.ai.impl;

final class AiAssistantToolCatalog {

    static final String TODAY_REVENUE = "todayRevenue";
    static final String TOP_PRODUCTS = "topProductsPeriod";
    static final String RETURNS_SUMMARY = "returnsSummaryPeriod";
    static final String REDISTRIBUTION = "stockRedistributionSuggestion";
    static final String STORE_INSIGHT = "storeSalesAndStockInsight";
    static final String BUSINESS_HEALTH = "businessHealthCheck";
    static final String SMALLTALK = "smalltalk";

    private AiAssistantToolCatalog() {
    }

    static boolean isAllowed(String tool) {
        return TODAY_REVENUE.equals(tool)
                || TOP_PRODUCTS.equals(tool)
                || RETURNS_SUMMARY.equals(tool)
                || REDISTRIBUTION.equals(tool)
                || STORE_INSIGHT.equals(tool)
                || BUSINESS_HEALTH.equals(tool)
                || SMALLTALK.equals(tool);
    }
}
