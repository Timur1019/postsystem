package com.pos.service.analytics.support;

import com.pos.cache.analytics.DailySalesAggregate;
import com.pos.mapper.ReportAnalyticsMapper;
import com.pos.repository.sale.SaleAggregateRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

@Component
@Transactional(readOnly = true)
public class ReportAnalyticsDailyAggregateLoader {

    private final SaleAggregateRepository saleAggregateRepository;
    private final ReportAnalyticsMapper analyticsMapper;

    public ReportAnalyticsDailyAggregateLoader(
        SaleAggregateRepository saleAggregateRepository,
        ReportAnalyticsMapper analyticsMapper
    ) {
        this.saleAggregateRepository = saleAggregateRepository;
        this.analyticsMapper = analyticsMapper;
    }

    public Map<LocalDate, DailySalesAggregate> load(Instant start, Instant end, ZoneId zone, Integer companyId) {
        Map<LocalDate, DailySalesAggregate> map = new HashMap<>();

        for (Object[] row : saleAggregateRepository.dailyRevenueAggregates(start, end, companyId)) {
            DailySalesAggregate agg = analyticsMapper.fromRevenueRow(row, zone);
            map.put(agg.day(), agg);
        }

        for (Object[] row : saleAggregateRepository.dailyItemsSoldAggregates(start, end, companyId)) {
            DailySalesAggregate incoming = analyticsMapper.fromItemsSoldRow(row, zone);
            map.merge(incoming.day(), incoming, analyticsMapper::mergeItems);
        }

        for (Object[] row : saleAggregateRepository.dailyCostEstimateAggregates(start, end, companyId)) {
            DailySalesAggregate incoming = analyticsMapper.fromCostEstimateRow(row, zone);
            map.merge(incoming.day(), incoming, analyticsMapper::mergeCost);
        }

        return Map.copyOf(map);
    }
}
