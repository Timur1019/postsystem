package com.pos.service.report.impl;

import com.pos.cache.analytics.ReportAnalyticsCache;
import com.pos.cache.analytics.ReportAnalyticsSnapshot;
import com.pos.dto.report.CashierStat;
import com.pos.dto.report.DailySummaryResponse;
import com.pos.dto.report.SalesReportResponse;
import com.pos.dto.report.TopProductRow;
import com.pos.dto.report.sales.PeriodCompareResponse;
import com.pos.service.ReportService;
import com.pos.service.analytics.ReportAnalyticsReadSupport;
import com.pos.service.report.support.PeriodCompareCalculator;
import com.pos.service.report.support.ReportAnalyticsCacheSupport;
import com.pos.service.report.support.ReportDbLoader;
import com.pos.service.report.support.ReportPeriodSupport;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final ReportAnalyticsCache analyticsCache;
    private final ReportDbLoader dbLoader;
    private final ReportPeriodSupport periods;
    private final ReportAnalyticsCacheSupport cacheSupport;
    private final PeriodCompareCalculator periodCompare;
    private final TenantAccessSupport tenantAccess;

    @Override
    public DailySummaryResponse getDailySummary(LocalDate date) {
        LocalDate target = date != null ? date : periods.today();
        if (periods.isToday(target)) {
            return dbLoader.dailySummary(target);
        }
        return analyticsCache.current(tenantAccess.requireEffectiveCompanyId())
            .filter(s -> s.covers(target))
            .map(s -> ReportAnalyticsReadSupport.dailySummary(s, target))
            .orElseGet(() -> dbLoader.dailySummary(target));
    }

    @Override
    public SalesReportResponse getSalesReport(LocalDate from, LocalDate to) {
        LocalDate end = to != null ? to : periods.today();
        LocalDate start = from != null ? from : end.minusDays(6);

        if (periods.rangeIncludesToday(start, end)) {
            return dbLoader.salesReport(start, end);
        }
        return analyticsCache.current(tenantAccess.requireEffectiveCompanyId())
            .filter(s -> s.coversRange(start, end))
            .map(s -> ReportAnalyticsReadSupport.salesReport(s, start, end))
            .orElseGet(() -> dbLoader.salesReport(start, end));
    }

    @Override
    public List<TopProductRow> getTopProducts(int limit, LocalDate from, LocalDate to) {
        LocalDate end = to != null ? to : periods.today();
        LocalDate start = from != null ? from : end.minus(30, ChronoUnit.DAYS);
        int cappedLimit = Math.max(1, limit);

        if (periods.rangeIncludesToday(start, end)) {
            return dbLoader.topProducts(cappedLimit, start, end);
        }
        var snapshotOpt = analyticsCache.current(tenantAccess.requireEffectiveCompanyId());
        if (snapshotOpt.isPresent()) {
            ReportAnalyticsSnapshot snapshot = snapshotOpt.get();
            if (!snapshot.coversRange(start, end)) {
                return dbLoader.topProducts(cappedLimit, start, end);
            }
            List<TopProductRow> cached = cacheSupport.resolveTopProducts(snapshot, start, end);
            if (cached != null) {
                return cached.stream().limit(cappedLimit).toList();
            }
        }
        return dbLoader.topProducts(cappedLimit, start, end);
    }

    @Override
    public List<CashierStat> getCashierPerformance(LocalDate from, LocalDate to) {
        LocalDate end = to != null ? to : periods.today();
        LocalDate start = from != null ? from : end.minus(30, ChronoUnit.DAYS);

        if (periods.rangeIncludesToday(start, end)) {
            return dbLoader.cashierPerformance(start, end);
        }
        var snapshotOpt = analyticsCache.current(tenantAccess.requireEffectiveCompanyId());
        if (snapshotOpt.isPresent()) {
            ReportAnalyticsSnapshot snapshot = snapshotOpt.get();
            if (!snapshot.coversRange(start, end)) {
                return dbLoader.cashierPerformance(start, end);
            }
            List<CashierStat> cached = cacheSupport.resolveCashierStats(snapshot, start, end);
            if (cached != null) {
                return cached;
            }
        }
        return dbLoader.cashierPerformance(start, end);
    }

    @Override
    public PeriodCompareResponse getPeriodCompare(LocalDate from, LocalDate to, Integer storeId) {
        return periodCompare.compare(from, to, storeId);
    }
}
