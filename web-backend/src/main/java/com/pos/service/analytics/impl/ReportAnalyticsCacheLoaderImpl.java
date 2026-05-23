package com.pos.service.analytics.impl;

import com.pos.cache.analytics.ReportAnalyticsSnapshot;
import com.pos.config.PosCacheProperties;
import com.pos.service.analytics.ReportAnalyticsCacheLoader;
import com.pos.service.cache.support.PosCacheWindowSupport;
import com.pos.service.analytics.support.ReportAnalyticsDailyAggregateLoader;
import com.pos.service.analytics.support.ReportAnalyticsRankingsLoader;
import com.pos.util.LogUtil;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
@Transactional(readOnly = true)
public class ReportAnalyticsCacheLoaderImpl implements ReportAnalyticsCacheLoader {

    private final ReportAnalyticsDailyAggregateLoader dailyLoader;
    private final ReportAnalyticsRankingsLoader rankingsLoader;
    private final PosCacheProperties properties;
    private final Executor reportCacheExecutor;

    public ReportAnalyticsCacheLoaderImpl(
        ReportAnalyticsDailyAggregateLoader dailyLoader,
        ReportAnalyticsRankingsLoader rankingsLoader,
        PosCacheProperties properties,
        @Qualifier("reportCacheExecutor") Executor reportCacheExecutor
    ) {
        this.dailyLoader = dailyLoader;
        this.rankingsLoader = rankingsLoader;
        this.properties = properties;
        this.reportCacheExecutor = reportCacheExecutor;
    }

    @Override
    public ReportAnalyticsSnapshot loadSnapshot(Integer companyId) {
        ZoneId zone = ZoneId.of(properties.getZoneId());
        LocalDate windowStart = PosCacheWindowSupport.windowStart(properties, zone);
        LocalDate windowEnd = PosCacheWindowSupport.windowEnd(zone);
        Instant start = windowStart.atStartOfDay(zone).toInstant();
        Instant end = windowEnd.plusDays(1).atStartOfDay(zone).toInstant();

        LogUtil.info(
            ReportAnalyticsCacheLoaderImpl.class,
            "Loading analytics cache: companyId={}, {} .. {} (zone {})",
            companyId,
            windowStart,
            windowEnd,
            zone
        );

        CompletableFuture<Map<LocalDate, com.pos.cache.analytics.DailySalesAggregate>> dailyFuture =
            CompletableFuture.supplyAsync(() -> dailyLoader.load(start, end, zone, companyId), reportCacheExecutor);

        LocalDate last7Start = windowEnd.minusDays(6);
        LocalDate last30Start = windowEnd.minusDays(29);
        int topLimit = properties.getTopProductsLimit();

        CompletableFuture<ReportAnalyticsRankingsLoader.ReportAnalyticsRankings> rankingsFuture =
            CompletableFuture.supplyAsync(
                () -> rankingsLoader.load(companyId, windowStart, windowEnd, last7Start, last30Start, topLimit),
                reportCacheExecutor
            );

        CompletableFuture.allOf(dailyFuture, rankingsFuture).join();

        var daily = dailyFuture.join();
        var rankings = rankingsFuture.join();

        return new ReportAnalyticsSnapshot(
            companyId,
            windowStart,
            windowEnd,
            Instant.now(),
            daily,
            rankings.topProductsWindow(),
            rankings.topProductsLast7Days(),
            rankings.topProductsLast30Days(),
            rankings.cashierStatsWindow(),
            rankings.cashierStatsLast30Days()
        );
    }
}
