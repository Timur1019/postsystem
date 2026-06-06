package com.pos.service.ai;

import com.pos.service.ai.tool.AnalyticsInventoryTools;
import com.pos.service.ai.tool.AnalyticsOverviewTools;
import com.pos.service.ai.tool.AnalyticsSalesTools;
import com.pos.service.ai.tool.AnalyticsStockInsightTools;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AnalyticsToolFacade {

    private final AnalyticsSalesTools salesTools;
    private final AnalyticsInventoryTools inventoryTools;
    private final AnalyticsStockInsightTools stockInsightTools;
    private final AnalyticsOverviewTools overviewTools;

    public Map<String, Object> salesPeriodOverview(LocalDate from, LocalDate to, Integer companyId) {
        return salesTools.salesPeriodOverview(from, to, companyId);
    }

    public Map<String, Object> zReportsOverview(LocalDate from, LocalDate to, Integer companyId) {
        return inventoryTools.zReportsOverview(from, to, companyId);
    }

    public Map<String, Object> inventoryOverview(LocalDate from, LocalDate to, Integer companyId) {
        return inventoryTools.inventoryOverview(from, to, companyId);
    }

    public Map<String, Object> todayRevenue(Integer companyId) {
        return salesTools.todayRevenue(companyId);
    }

    public Map<String, Object> topProductsPeriod(LocalDate from, LocalDate to, int limit) {
        return salesTools.topProductsPeriod(from, to, limit);
    }

    public Map<String, Object> returnsSummaryPeriod(LocalDate from, LocalDate to, Integer companyId) {
        return salesTools.returnsSummaryPeriod(from, to, companyId);
    }

    public Map<String, Object> stockRedistributionSuggestion(LocalDate from, LocalDate to, Integer companyId) {
        return stockInsightTools.stockRedistributionSuggestion(from, to, companyId);
    }

    public Map<String, Object> storeSalesAndStockInsight(LocalDate from, LocalDate to, Integer companyId) {
        return stockInsightTools.storeSalesAndStockInsight(from, to, companyId);
    }

    public Map<String, Object> businessHealthCheck(LocalDate from, LocalDate to, Integer companyId) {
        return overviewTools.businessHealthCheck(from, to, companyId);
    }

    public Map<String, Object> executiveSystemOverview(LocalDate from, LocalDate to, Integer companyId) {
        return overviewTools.executiveSystemOverview(from, to, companyId);
    }
}
