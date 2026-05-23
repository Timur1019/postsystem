package com.pos.service.analytics.support;

import com.pos.cache.analytics.DailySalesAggregate;
import com.pos.mapper.ReportAnalyticsMapper;
import com.pos.repository.SaleItemRepository;
import com.pos.repository.SaleRepository;
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

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ReportAnalyticsMapper analyticsMapper;

    public ReportAnalyticsDailyAggregateLoader(
        SaleRepository saleRepository,
        SaleItemRepository saleItemRepository,
        ReportAnalyticsMapper analyticsMapper
    ) {
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.analyticsMapper = analyticsMapper;
    }

    public Map<LocalDate, DailySalesAggregate> load(Instant start, Instant end, ZoneId zone, Integer companyId) {
        Map<LocalDate, DailySalesAggregate> map = new HashMap<>();

        for (Object[] row : saleRepository.dailyRevenueAggregates(start, end, companyId)) {
            DailySalesAggregate agg = analyticsMapper.fromRevenueRow(row, zone);
            map.put(agg.day(), agg);
        }

        for (Object[] row : saleItemRepository.dailyItemsSoldAggregates(start, end, companyId)) {
            DailySalesAggregate incoming = analyticsMapper.fromItemsSoldRow(row, zone);
            map.merge(incoming.day(), incoming, analyticsMapper::mergeItems);
        }

        for (Object[] row : saleItemRepository.dailyCostEstimateAggregates(start, end, companyId)) {
            DailySalesAggregate incoming = analyticsMapper.fromCostEstimateRow(row, zone);
            map.merge(incoming.day(), incoming, analyticsMapper::mergeCost);
        }

        return Map.copyOf(map);
    }
}
