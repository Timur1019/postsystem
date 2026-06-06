package com.pos.service.ai.tool;

import com.pos.entity.StockInventory;
import com.pos.repository.StockInventoryRepository;
import com.pos.repository.ZReportRepository;
import com.pos.repository.report.StockReportRepository;
import com.pos.service.ai.AiAnalyticsMaps;
import com.pos.service.ai.AiAssistantParallel;
import com.pos.service.ai.support.AnalyticsPeriodSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static com.pos.service.ai.support.AnalyticsPeriodSupport.period;

@Component
@RequiredArgsConstructor
public class AnalyticsInventoryTools {

    private final StockInventoryRepository stockInventoryRepository;
    private final StockReportRepository stockReportRepository;
    private final ZReportRepository zReportRepository;
    private final AiAssistantParallel parallel;

    public Map<String, Object> zReportsOverview(LocalDate from, LocalDate to, Integer companyId) {
        AnalyticsPeriodSupport.Period range = period(from, to, 90);

        CompletableFuture<Long> totalInSystemF = parallel.supply(
            () -> zReportRepository.countByCompanyId(companyId)
        );
        CompletableFuture<Object[]> periodSummaryF = parallel.supply(
            () -> zReportRepository.summarizeByCompanyAndClosedAtBetween(
                companyId, range.start(), range.end()
            )
        );
        CompletableFuture<List<Map<String, Object>>> recentF = parallel.supply(
            () -> loadRecentZReportRows(companyId, 15)
        );
        AiAssistantParallel.awaitAll(totalInSystemF, periodSummaryF, recentF);

        Object[] periodSummary = periodSummaryF.join();
        long periodCount = periodSummary != null && periodSummary.length > 0 && periodSummary[0] instanceof Number n
            ? n.longValue() : 0L;
        BigDecimal periodTotal = periodSummary != null && periodSummary.length > 1 && periodSummary[1] instanceof BigDecimal b
            ? b : BigDecimal.ZERO;

        Map<String, Object> out = AiAnalyticsMaps.create();
        out.put("from", range.from().toString());
        out.put("to", range.to().toString());
        out.put("periodCount", periodCount);
        out.put("periodTotalAmount", periodTotal);
        out.put("totalInSystem", totalInSystemF.join());
        out.put("recentReports", recentF.join());
        return out;
    }

    public Map<String, Object> inventoryOverview(LocalDate from, LocalDate to, Integer companyId) {
        AnalyticsPeriodSupport.Period range = period(from, to, 30);

        CompletableFuture<InventorySlice> inventoryF = parallel.supply(
            () -> loadInventorySlice(companyId, range.start(), range.end())
        );
        CompletableFuture<List<Map<String, Object>>> lowStockF = parallel.supply(
            () -> loadLowStockRows(companyId)
        );
        AiAssistantParallel.awaitAll(inventoryF, lowStockF);

        InventorySlice inventorySlice = inventoryF.join();
        List<Map<String, Object>> lowStockRows = lowStockF.join();

        return Map.of(
            "from", range.from().toString(),
            "to", range.to().toString(),
            "inventoriesCount", inventorySlice.count(),
            "recentInventories", inventorySlice.recent(),
            "lowStockCount", lowStockRows.size(),
            "lowStockProducts", lowStockRows
        );
    }

    private List<Map<String, Object>> loadRecentZReportRows(Integer companyId, int limit) {
        return zReportRepository.findRecentByCompanyId(companyId, PageRequest.of(0, limit))
            .getContent()
            .stream()
            .map(z -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("zNumber", z.getZNumber());
                row.put("storeName", z.getStore() != null ? z.getStore().getName() : "—");
                row.put("closedAt", z.getClosedAt() != null ? z.getClosedAt().toString() : "—");
                row.put("totalAmount", AiAnalyticsMaps.money(z.getTotalAmount()));
                row.put("salesCount", z.getSalesCount() != null ? z.getSalesCount() : 0);
                row.put("employeeName", z.getEmployeeName());
                return row;
            })
            .toList();
    }

    private InventorySlice loadInventorySlice(Integer companyId, Instant start, Instant end) {
        var page = stockInventoryRepository.findByCompanyBetween(companyId, start, end, PageRequest.of(0, 10));
        List<Map<String, Object>> recent = page.getContent().stream()
            .map(this::toInventoryRow)
            .toList();
        return new InventorySlice(page.getTotalElements(), recent);
    }

    private List<Map<String, Object>> loadLowStockRows(Integer companyId) {
        return stockReportRepository.lowStockProducts(companyId, PageRequest.of(0, 15)).stream()
            .map(p -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("productName", p.getName());
                row.put("stockQty", p.getStockQuantity());
                row.put("lowStockAlert", p.getLowStockAlert());
                return row;
            })
            .toList();
    }

    private Map<String, Object> toInventoryRow(StockInventory i) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("inventoryNumber", i.getInventoryNumber());
        row.put("storeName", i.getStore() != null ? i.getStore().getName() : "—");
        row.put("status", i.getStatus());
        row.put("totalLines", i.getTotalLines());
        row.put("totalDifference", i.getTotalDifference());
        row.put("createdAt", i.getCreatedAt() != null ? i.getCreatedAt().toString() : "—");
        return row;
    }

    private record InventorySlice(long count, List<Map<String, Object>> recent) {
    }
}
