package com.pos.service.ai.tool;

import com.pos.dto.report.SalesReportResponse;
import com.pos.dto.report.TopProductRow;
import com.pos.entity.Sale;
import com.pos.repository.sale.SaleAggregateRepository;
import com.pos.service.ReportService;
import com.pos.service.ai.AiAnalyticsMaps;
import com.pos.service.ai.AiAssistantParallel;
import com.pos.service.ai.support.AnalyticsPeriodSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static com.pos.service.ai.support.AnalyticsPeriodSupport.ZONE;
import static com.pos.service.ai.support.AnalyticsPeriodSupport.period;
import static com.pos.service.ai.support.AnalyticsPeriodSupport.today;

@Component
@RequiredArgsConstructor
public class AnalyticsSalesTools {

    private final ReportService reportService;
    private final SaleAggregateRepository saleAggregateRepository;
    private final AiAssistantParallel parallel;

    public Map<String, Object> salesPeriodOverview(LocalDate from, LocalDate to, Integer companyId) {
        AnalyticsPeriodSupport.Period range = period(from, to, 6);
        CompletableFuture<SalesReportResponse> salesF = parallel.supply(
            () -> reportService.getSalesReport(range.from(), range.to())
        );
        CompletableFuture<List<Object[]>> storesF = parallel.supply(
            () -> saleAggregateRepository.salesByStoreBetween(range.start(), range.end(), companyId)
        );
        AiAssistantParallel.awaitAll(salesF, storesF);

        SalesReportResponse sales = salesF.join();
        List<Map<String, Object>> stores = storesF.join().stream()
            .limit(5)
            .map(row -> {
                Map<String, Object> one = AiAnalyticsMaps.create();
                one.put("storeName", row[1] != null ? String.valueOf(row[1]) : "—");
                one.put("revenue", AiAnalyticsMaps.safe(row[2]));
                one.put("checks", row[3] != null ? ((Number) row[3]).longValue() : 0L);
                return one;
            })
            .toList();

        Map<String, Object> out = AiAnalyticsMaps.create();
        out.put("from", range.from().toString());
        out.put("to", range.to().toString());
        out.put("revenue", AiAnalyticsMaps.money(sales.totalRevenue()));
        out.put("transactions", sales.transactionCount());
        out.put("averageCheck", AiAnalyticsMaps.money(sales.averageTransactionValue()));
        out.put("stores", stores);
        return out;
    }

    public Map<String, Object> todayRevenue(Integer companyId) {
        LocalDate today = today();
        Instant chartStart = today.minusDays(6).atStartOfDay(ZONE).toInstant();
        Instant chartEnd = today.plusDays(1).atStartOfDay(ZONE).toInstant();
        CompletableFuture<SalesReportResponse> reportF = parallel.supply(
            () -> reportService.getSalesReport(today, today)
        );
        CompletableFuture<List<Object[]>> dailyF = parallel.supply(
            () -> saleAggregateRepository.dailyRevenueAggregates(chartStart, chartEnd, companyId)
        );
        AiAssistantParallel.awaitAll(reportF, dailyF);

        SalesReportResponse report = reportF.join();
        List<Map<String, Object>> chart = new ArrayList<>();
        for (Object[] row : dailyF.join()) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("name", String.valueOf(row[0]));
            point.put("revenue", row[1]);
            point.put("stockQty", 0);
            chart.add(point);
        }

        Map<String, Object> out = AiAnalyticsMaps.create();
        out.put("date", today.toString());
        out.put("totalRevenue", AiAnalyticsMaps.money(report.totalRevenue()));
        out.put("transactionCount", report.transactionCount());
        out.put("averageCheck", AiAnalyticsMaps.money(report.averageTransactionValue()));
        out.put("chart", chart);
        return out;
    }

    public Map<String, Object> topProductsPeriod(LocalDate from, LocalDate to, int limit) {
        AnalyticsPeriodSupport.Period range = period(from, to, 6);
        int safeLimit = Math.max(1, Math.min(limit, 20));
        List<TopProductRow> rows = reportService.getTopProducts(safeLimit, range.from(), range.to());
        return Map.of(
            "from", range.from().toString(),
            "to", range.to().toString(),
            "items", rows
        );
    }

    public Map<String, Object> returnsSummaryPeriod(LocalDate from, LocalDate to, Integer companyId) {
        AnalyticsPeriodSupport.Period range = period(from, to, 6);
        List<Object[]> agg = saleAggregateRepository.aggregateReturnsBetween(
            range.start(),
            range.end(),
            List.of(Sale.SaleStatus.REFUNDED, Sale.SaleStatus.VOIDED),
            companyId
        );
        long count = 0L;
        BigDecimal total = BigDecimal.ZERO;
        if (!agg.isEmpty()) {
            Object[] row = agg.get(0);
            count = row[0] != null ? ((Number) row[0]).longValue() : 0L;
            total = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
        }
        return Map.of(
            "from", range.from().toString(),
            "to", range.to().toString(),
            "returnsCount", count,
            "returnsAmount", total
        );
    }
}
