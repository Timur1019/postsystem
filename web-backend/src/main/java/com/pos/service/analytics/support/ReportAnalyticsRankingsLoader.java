package com.pos.service.analytics.support;

import com.pos.dto.report.CashierStat;
import com.pos.dto.report.TopProductRow;
import com.pos.mapper.ReportMapper;
import com.pos.repository.sale.SaleAggregateRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Component
@Transactional(readOnly = true)
public class ReportAnalyticsRankingsLoader {

    private final SaleAggregateRepository saleAggregateRepository;
    private final ReportMapper reportMapper;
    private final Executor reportCacheExecutor;

    public ReportAnalyticsRankingsLoader(
        SaleAggregateRepository saleAggregateRepository,
        ReportMapper reportMapper,
        @Qualifier("reportCacheExecutor") Executor reportCacheExecutor
    ) {
        this.saleAggregateRepository = saleAggregateRepository;
        this.reportMapper = reportMapper;
        this.reportCacheExecutor = reportCacheExecutor;
    }

    public ReportAnalyticsRankings load(
        Integer companyId,
        LocalDate windowStart,
        LocalDate windowEnd,
        LocalDate last7Start,
        LocalDate last30Start,
        int topLimit
    ) {
        CompletableFuture<List<TopProductRow>> topWindowFuture =
            CompletableFuture.supplyAsync(
                () -> reportMapper.toTopProductRowList(
                    saleAggregateRepository.topProductsRaw(windowStart, windowEnd, topLimit, companyId)
                ),
                reportCacheExecutor
            );

        CompletableFuture<List<TopProductRow>> top7Future =
            CompletableFuture.supplyAsync(
                () -> reportMapper.toTopProductRowList(
                    saleAggregateRepository.topProductsRaw(last7Start, windowEnd, topLimit, companyId)
                ),
                reportCacheExecutor
            );

        CompletableFuture<List<TopProductRow>> top30Future =
            CompletableFuture.supplyAsync(
                () -> reportMapper.toTopProductRowList(
                    saleAggregateRepository.topProductsRaw(last30Start, windowEnd, topLimit, companyId)
                ),
                reportCacheExecutor
            );

        CompletableFuture<List<CashierStat>> cashierWindowFuture =
            CompletableFuture.supplyAsync(
                () -> reportMapper.toCashierStatList(
                    saleAggregateRepository.cashierPerformanceRaw(windowStart, windowEnd, companyId)
                ),
                reportCacheExecutor
            );

        CompletableFuture<List<CashierStat>> cashier30Future =
            CompletableFuture.supplyAsync(
                () -> reportMapper.toCashierStatList(
                    saleAggregateRepository.cashierPerformanceRaw(last30Start, windowEnd, companyId)
                ),
                reportCacheExecutor
            );

        CompletableFuture.allOf(
            topWindowFuture, top7Future, top30Future, cashierWindowFuture, cashier30Future
        ).join();

        return new ReportAnalyticsRankings(
            topWindowFuture.join(),
            top7Future.join(),
            top30Future.join(),
            cashierWindowFuture.join(),
            cashier30Future.join()
        );
    }

    public record ReportAnalyticsRankings(
        List<TopProductRow> topProductsWindow,
        List<TopProductRow> topProductsLast7Days,
        List<TopProductRow> topProductsLast30Days,
        List<CashierStat> cashierStatsWindow,
        List<CashierStat> cashierStatsLast30Days
    ) {}
}
