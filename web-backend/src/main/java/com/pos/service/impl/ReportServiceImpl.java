package com.pos.service.impl;

import com.pos.cache.analytics.ReportAnalyticsCache;
import com.pos.cache.analytics.ReportAnalyticsSnapshot;
import com.pos.config.PosCacheProperties;
import com.pos.dto.report.CashierStat;
import com.pos.dto.report.DailyPoint;
import com.pos.dto.report.DailySummaryResponse;
import com.pos.dto.report.SalesReportResponse;
import com.pos.dto.report.TopProductRow;
import com.pos.entity.Sale;
import com.pos.mapper.ReportMapper;
import com.pos.repository.SaleItemRepository;
import com.pos.repository.SaleRepository;
import com.pos.service.ReportService;
import com.pos.service.analytics.ReportAnalyticsReadSupport;
import com.pos.service.analytics.ReportAnalyticsWindowSupport;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ReportMapper reportMapper;
    private final ReportAnalyticsCache analyticsCache;
    private final PosCacheProperties cacheProperties;

    @Override
    public DailySummaryResponse getDailySummary(LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now(zone());
        return analyticsCache.current()
            .filter(s -> s.covers(target))
            .map(s -> ReportAnalyticsReadSupport.dailySummary(s, target))
            .orElseGet(() -> loadDailySummaryFromDb(target));
    }

    @Override
    public SalesReportResponse getSalesReport(LocalDate from, LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now(zone());
        LocalDate start = from != null ? from : end.minusDays(6);

        return analyticsCache.current()
            .filter(s -> s.coversRange(start, end))
            .map(s -> ReportAnalyticsReadSupport.salesReport(s, start, end))
            .orElseGet(() -> loadSalesReportFromDb(start, end));
    }

    @Override
    public List<TopProductRow> getTopProducts(int limit, LocalDate from, LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now(zone());
        LocalDate start = from != null ? from : end.minus(30, ChronoUnit.DAYS);

        int cappedLimit = Math.max(1, limit);
        var snapshotOpt = analyticsCache.current();
        if (snapshotOpt.isPresent()) {
            ReportAnalyticsSnapshot snapshot = snapshotOpt.get();
            if (!snapshot.coversRange(start, end)) {
                return loadTopProductsFromDb(cappedLimit, start, end);
            }
            List<TopProductRow> cached = resolveCachedTopProducts(snapshot, start, end);
            if (cached != null) {
                return cached.stream().limit(cappedLimit).toList();
            }
        }

        return loadTopProductsFromDb(cappedLimit, start, end);
    }

    @Override
    public List<CashierStat> getCashierPerformance(LocalDate from, LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now(zone());
        LocalDate start = from != null ? from : end.minus(30, ChronoUnit.DAYS);

        var snapshotOpt = analyticsCache.current();
        if (snapshotOpt.isPresent()) {
            ReportAnalyticsSnapshot snapshot = snapshotOpt.get();
            if (!snapshot.coversRange(start, end)) {
                return loadCashierPerformanceFromDb(start, end);
            }
            List<CashierStat> cached = resolveCachedCashierStats(snapshot, start, end);
            if (cached != null) {
                return cached;
            }
        }

        return loadCashierPerformanceFromDb(start, end);
    }

    private List<TopProductRow> resolveCachedTopProducts(
        ReportAnalyticsSnapshot snapshot,
        LocalDate from,
        LocalDate to
    ) {
        if (isFullWindowQuery(snapshot, from, to)) {
            return snapshot.topProductsWindow();
        }
        if (ReportAnalyticsWindowSupport.isLastCalendarDays(from, to, snapshot.windowEnd(), 7)) {
            return snapshot.topProductsLast7Days();
        }
        if (ReportAnalyticsWindowSupport.isLastCalendarDays(from, to, snapshot.windowEnd(), 30)) {
            return snapshot.topProductsLast30Days();
        }
        return null;
    }

    private List<CashierStat> resolveCachedCashierStats(
        ReportAnalyticsSnapshot snapshot,
        LocalDate from,
        LocalDate to
    ) {
        if (isFullWindowQuery(snapshot, from, to)) {
            return snapshot.cashierStatsWindow();
        }
        if (ReportAnalyticsWindowSupport.isLastCalendarDays(from, to, snapshot.windowEnd(), 30)) {
            return snapshot.cashierStatsLast30Days();
        }
        return null;
    }

    private boolean isFullWindowQuery(ReportAnalyticsSnapshot snapshot, LocalDate from, LocalDate to) {
        return from.equals(snapshot.windowStart()) && to.equals(snapshot.windowEnd());
    }

    private ZoneId zone() {
        return ZoneId.of(cacheProperties.getZoneId());
    }

    private DailySummaryResponse loadDailySummaryFromDb(LocalDate date) {
        ZoneId z = zone();
        var start = date.atStartOfDay(z).toInstant();
        var end = date.plusDays(1).atStartOfDay(z).toInstant();
        var status = Sale.SaleStatus.COMPLETED;

        BigDecimal revenue = saleRepository.sumTotalBetween(start, end, status);
        long transactions = saleRepository.countSalesBetween(start, end, status);
        long itemsSold = saleItemRepository.sumQuantitySoldBetween(start, end, status);

        return new DailySummaryResponse(
            revenue != null ? revenue : BigDecimal.ZERO,
            transactions,
            itemsSold
        );
    }

    private SalesReportResponse loadSalesReportFromDb(LocalDate from, LocalDate to) {
        ZoneId z = zone();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        List<DailyPoint> breakdown = new ArrayList<>();

        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            var start = d.atStartOfDay(z).toInstant();
            var end = d.plusDays(1).atStartOfDay(z).toInstant();
            BigDecimal rev = saleRepository.sumTotalBetween(start, end, Sale.SaleStatus.COMPLETED);
            if (rev == null) {
                rev = BigDecimal.ZERO;
            }
            totalRevenue = totalRevenue.add(rev);
            breakdown.add(new DailyPoint(d.toString(), rev));
        }

        LogUtil.debug(ReportServiceImpl.class, "Sales report loaded from DB for {} .. {}", from, to);
        return new SalesReportResponse(totalRevenue, breakdown);
    }

    private List<TopProductRow> loadTopProductsFromDb(int limit, LocalDate from, LocalDate to) {
        LocalDate clampedFrom = clampFrom(from);
        LocalDate clampedTo = clampTo(to);
        return reportMapper.toTopProductRowList(
            saleItemRepository.topProductsRaw(clampedFrom, clampedTo, Math.max(1, limit))
        );
    }

    private List<CashierStat> loadCashierPerformanceFromDb(LocalDate from, LocalDate to) {
        LocalDate clampedFrom = clampFrom(from);
        LocalDate clampedTo = clampTo(to);
        return reportMapper.toCashierStatList(
            saleItemRepository.cashierPerformanceRaw(clampedFrom, clampedTo)
        );
    }

    private LocalDate clampFrom(LocalDate from) {
        ZoneId z = zone();
        LocalDate windowStart = ReportAnalyticsWindowSupport.windowStart(cacheProperties, z);
        LocalDate windowEnd = ReportAnalyticsWindowSupport.windowEnd(z);
        return ReportAnalyticsWindowSupport.clampFrom(from, windowStart, windowEnd);
    }

    private LocalDate clampTo(LocalDate to) {
        ZoneId z = zone();
        LocalDate windowStart = ReportAnalyticsWindowSupport.windowStart(cacheProperties, z);
        LocalDate windowEnd = ReportAnalyticsWindowSupport.windowEnd(z);
        return ReportAnalyticsWindowSupport.clampTo(to, windowStart, windowEnd);
    }
}
