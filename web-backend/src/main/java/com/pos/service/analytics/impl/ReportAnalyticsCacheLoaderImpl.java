package com.pos.service.analytics.impl;

import com.pos.cache.analytics.DailySalesAggregate;
import com.pos.cache.analytics.ReportAnalyticsSnapshot;
import com.pos.config.PosCacheProperties;
import com.pos.dto.report.CashierStat;
import com.pos.dto.report.TopProductRow;
import com.pos.mapper.ReportMapper;
import com.pos.repository.SaleItemRepository;
import com.pos.repository.SaleRepository;
import com.pos.service.analytics.ReportAnalyticsCacheLoader;
import com.pos.service.analytics.ReportAnalyticsWindowSupport;
import com.pos.util.LogUtil;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
@Transactional(readOnly = true)
public class ReportAnalyticsCacheLoaderImpl implements ReportAnalyticsCacheLoader {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ReportMapper reportMapper;
    private final PosCacheProperties properties;
    private final Executor reportCacheExecutor;

    public ReportAnalyticsCacheLoaderImpl(
        SaleRepository saleRepository,
        SaleItemRepository saleItemRepository,
        ReportMapper reportMapper,
        PosCacheProperties properties,
        @Qualifier("reportCacheExecutor") Executor reportCacheExecutor
    ) {
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.reportMapper = reportMapper;
        this.properties = properties;
        this.reportCacheExecutor = reportCacheExecutor;
    }

    @Override
    public ReportAnalyticsSnapshot loadSnapshot() {
        ZoneId zone = ZoneId.of(properties.getZoneId());
        LocalDate windowStart = ReportAnalyticsWindowSupport.windowStart(properties, zone);
        LocalDate windowEnd = ReportAnalyticsWindowSupport.windowEnd(zone);
        Instant start = windowStart.atStartOfDay(zone).toInstant();
        Instant end = windowEnd.plusDays(1).atStartOfDay(zone).toInstant();

        LogUtil.info(
            ReportAnalyticsCacheLoaderImpl.class,
            "Loading analytics cache: {} .. {} (zone {})",
            windowStart,
            windowEnd,
            zone
        );

        CompletableFuture<Map<LocalDate, DailySalesAggregate>> dailyFuture =
            CompletableFuture.supplyAsync(() -> loadDailyAggregates(start, end, zone), reportCacheExecutor);

        LocalDate last7Start = windowEnd.minusDays(6);
        LocalDate last30Start = windowEnd.minusDays(29);
        int topLimit = properties.getTopProductsLimit();

        CompletableFuture<List<TopProductRow>> topWindowFuture =
            CompletableFuture.supplyAsync(
                () -> reportMapper.toTopProductRowList(
                    saleItemRepository.topProductsRaw(windowStart, windowEnd, topLimit)
                ),
                reportCacheExecutor
            );

        CompletableFuture<List<TopProductRow>> top7Future =
            CompletableFuture.supplyAsync(
                () -> reportMapper.toTopProductRowList(
                    saleItemRepository.topProductsRaw(last7Start, windowEnd, topLimit)
                ),
                reportCacheExecutor
            );

        CompletableFuture<List<TopProductRow>> top30Future =
            CompletableFuture.supplyAsync(
                () -> reportMapper.toTopProductRowList(
                    saleItemRepository.topProductsRaw(last30Start, windowEnd, topLimit)
                ),
                reportCacheExecutor
            );

        CompletableFuture<List<CashierStat>> cashierWindowFuture =
            CompletableFuture.supplyAsync(
                () -> reportMapper.toCashierStatList(
                    saleItemRepository.cashierPerformanceRaw(windowStart, windowEnd)
                ),
                reportCacheExecutor
            );

        CompletableFuture<List<CashierStat>> cashier30Future =
            CompletableFuture.supplyAsync(
                () -> reportMapper.toCashierStatList(
                    saleItemRepository.cashierPerformanceRaw(last30Start, windowEnd)
                ),
                reportCacheExecutor
            );

        CompletableFuture.allOf(
            dailyFuture, topWindowFuture, top7Future, top30Future, cashierWindowFuture, cashier30Future
        ).join();

        return new ReportAnalyticsSnapshot(
            windowStart,
            windowEnd,
            Instant.now(),
            dailyFuture.join(),
            topWindowFuture.join(),
            top7Future.join(),
            top30Future.join(),
            cashierWindowFuture.join(),
            cashier30Future.join()
        );
    }

    private Map<LocalDate, DailySalesAggregate> loadDailyAggregates(Instant start, Instant end, ZoneId zone) {
        Map<LocalDate, DailySalesAggregate> map = new HashMap<>();

        for (Object[] row : saleRepository.dailyRevenueAggregates(start, end)) {
            LocalDate day = toLocalDate(row[0], zone);
            BigDecimal revenue = toBigDecimal(row[1]);
            long txCount = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            map.put(day, new DailySalesAggregate(day, revenue, txCount, 0L, BigDecimal.ZERO));
        }

        for (Object[] row : saleItemRepository.dailyItemsSoldAggregates(start, end)) {
            LocalDate day = toLocalDate(row[0], zone);
            long items = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            map.merge(day, new DailySalesAggregate(day, BigDecimal.ZERO, 0L, items, BigDecimal.ZERO), (a, b) ->
                new DailySalesAggregate(
                    day,
                    a.revenue(),
                    a.transactionCount(),
                    b.itemsSold(),
                    a.costEstimate()
                )
            );
        }

        for (Object[] row : saleItemRepository.dailyCostEstimateAggregates(start, end)) {
            LocalDate day = toLocalDate(row[0], zone);
            BigDecimal cost = toBigDecimal(row[1]);
            map.merge(day, new DailySalesAggregate(day, BigDecimal.ZERO, 0L, 0L, cost), (a, b) ->
                new DailySalesAggregate(
                    day,
                    a.revenue(),
                    a.transactionCount(),
                    a.itemsSold(),
                    b.costEstimate()
                )
            );
        }

        return Map.copyOf(map);
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        return new BigDecimal(value.toString());
    }

    private static LocalDate toLocalDate(Object value, ZoneId zone) {
        if (value instanceof LocalDate ld) {
            return ld;
        }
        if (value instanceof Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        if (value instanceof java.util.Date utilDate) {
            return utilDate.toInstant().atZone(zone).toLocalDate();
        }
        if (value instanceof Instant instant) {
            return instant.atZone(zone).toLocalDate();
        }
        throw new IllegalArgumentException("Unsupported date type in aggregate: " + value.getClass());
    }
}
