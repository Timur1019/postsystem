package com.pos.service.ai;

import com.pos.dto.report.SalesReportResponse;
import com.pos.dto.report.TopProductRow;
import com.pos.entity.Product;
import com.pos.entity.Sale;
import com.pos.entity.StockInventory;
import com.pos.entity.StoreStock;
import com.pos.repository.ProductRepository;
import com.pos.repository.StockInventoryRepository;
import com.pos.repository.SaleItemRepository;
import com.pos.repository.SaleRepository;
import com.pos.repository.CategoryRepository;
import com.pos.repository.StoreRepository;
import com.pos.repository.StoreStockRepository;
import com.pos.repository.ZReportRepository;
import com.pos.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Component
@RequiredArgsConstructor
public class AnalyticsToolFacade {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final ReportService reportService;
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final StoreStockRepository storeStockRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;
    private final ZReportRepository zReportRepository;
    private final StockInventoryRepository stockInventoryRepository;
    private final AiAssistantParallel parallel;

    public Map<String, Object> salesPeriodOverview(LocalDate from, LocalDate to, Integer companyId) {
        LocalDate safeFrom = from != null ? from : LocalDate.now(ZONE).minusDays(6);
        LocalDate safeTo = to != null ? to : LocalDate.now(ZONE);
        Instant start = safeFrom.atStartOfDay(ZONE).toInstant();
        Instant end = safeTo.plusDays(1).atStartOfDay(ZONE).toInstant();
        LocalDate fromFinal = safeFrom;
        LocalDate toFinal = safeTo;
        CompletableFuture<SalesReportResponse> salesF = parallel.supply(
                () -> reportService.getSalesReport(fromFinal, toFinal));
        CompletableFuture<List<Object[]>> storesF = parallel.supply(
                () -> saleRepository.salesByStoreBetween(start, end, companyId));
        AiAssistantParallel.awaitAll(salesF, storesF);
        SalesReportResponse sales = salesF.join();
        List<Object[]> storesRaw = storesF.join();
        List<Map<String, Object>> stores = storesRaw.stream()
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
        out.put("from", safeFrom.toString());
        out.put("to", safeTo.toString());
        out.put("revenue", AiAnalyticsMaps.money(sales.totalRevenue()));
        out.put("transactions", sales.transactionCount());
        out.put("averageCheck", AiAnalyticsMaps.money(sales.averageTransactionValue()));
        out.put("stores", stores);
        return out;
    }

    public Map<String, Object> zReportsOverview(LocalDate from, LocalDate to, Integer companyId) {
        LocalDate safeFrom = from != null ? from : LocalDate.now(ZONE).minusDays(90);
        LocalDate safeTo = to != null ? to : LocalDate.now(ZONE);
        Instant start = safeFrom.atStartOfDay(ZONE).toInstant();
        Instant end = safeTo.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyIdFinal = companyId;

        CompletableFuture<Long> totalInSystemF = parallel.supply(
                () -> zReportRepository.countByCompanyId(companyIdFinal));
        CompletableFuture<Object[]> periodSummaryF = parallel.supply(
                () -> zReportRepository.summarizeByCompanyAndClosedAtBetween(companyIdFinal, start, end));
        CompletableFuture<List<Map<String, Object>>> recentF = parallel.supply(
                () -> loadRecentZReportRows(companyIdFinal, 15));
        AiAssistantParallel.awaitAll(totalInSystemF, periodSummaryF, recentF);

        long totalInSystem = totalInSystemF.join();
        Object[] periodSummary = periodSummaryF.join();
        long periodCount = periodSummary != null && periodSummary.length > 0 && periodSummary[0] instanceof Number n
                ? n.longValue() : 0L;
        BigDecimal periodTotal = periodSummary != null && periodSummary.length > 1 && periodSummary[1] instanceof BigDecimal b
                ? b : BigDecimal.ZERO;

        Map<String, Object> out = AiAnalyticsMaps.create();
        out.put("from", safeFrom.toString());
        out.put("to", safeTo.toString());
        out.put("periodCount", periodCount);
        out.put("periodTotalAmount", periodTotal);
        out.put("totalInSystem", totalInSystem);
        out.put("recentReports", recentF.join());
        return out;
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

    public Map<String, Object> inventoryOverview(LocalDate from, LocalDate to, Integer companyId) {
        LocalDate safeFrom = from != null ? from : LocalDate.now(ZONE).minusDays(30);
        LocalDate safeTo = to != null ? to : LocalDate.now(ZONE);
        Instant start = safeFrom.atStartOfDay(ZONE).toInstant();
        Instant end = safeTo.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyIdFinal = companyId;

        CompletableFuture<InventorySlice> inventoryF = parallel.supply(() -> loadInventorySlice(companyIdFinal, start, end));
        CompletableFuture<List<Map<String, Object>>> lowStockF = parallel.supply(
                () -> loadLowStockRows(companyIdFinal));
        AiAssistantParallel.awaitAll(inventoryF, lowStockF);

        InventorySlice inventorySlice = inventoryF.join();
        List<Map<String, Object>> lowStockRows = lowStockF.join();

        return Map.of(
                "from", safeFrom.toString(),
                "to", safeTo.toString(),
                "inventoriesCount", inventorySlice.count(),
                "recentInventories", inventorySlice.recent(),
                "lowStockCount", lowStockRows.size(),
                "lowStockProducts", lowStockRows
        );
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

    public Map<String, Object> todayRevenue(Integer companyId) {
        LocalDate today = LocalDate.now(ZONE);
        Instant chartStart = today.minusDays(6).atStartOfDay(ZONE).toInstant();
        Instant chartEnd = today.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyIdFinal = companyId;
        CompletableFuture<SalesReportResponse> reportF = parallel.supply(
                () -> reportService.getSalesReport(today, today));
        CompletableFuture<List<Object[]>> dailyF = parallel.supply(
                () -> saleRepository.dailyRevenueAggregates(chartStart, chartEnd, companyIdFinal));
        AiAssistantParallel.awaitAll(reportF, dailyF);
        SalesReportResponse report = reportF.join();
        List<Object[]> daily = dailyF.join();
        List<Map<String, Object>> chart = new ArrayList<>();
        for (Object[] row : daily) {
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
        LocalDate safeFrom = from != null ? from : LocalDate.now(ZONE).minusDays(6);
        LocalDate safeTo = to != null ? to : LocalDate.now(ZONE);
        int safeLimit = Math.max(1, Math.min(limit, 20));
        List<TopProductRow> rows = reportService.getTopProducts(safeLimit, safeFrom, safeTo);
        return Map.of(
            "from", safeFrom.toString(),
            "to", safeTo.toString(),
            "items", rows
        );
    }

    public Map<String, Object> returnsSummaryPeriod(LocalDate from, LocalDate to, Integer companyId) {
        LocalDate safeFrom = from != null ? from : LocalDate.now(ZONE).minusDays(6);
        LocalDate safeTo = to != null ? to : LocalDate.now(ZONE);
        Instant start = safeFrom.atStartOfDay(ZONE).toInstant();
        Instant end = safeTo.plusDays(1).atStartOfDay(ZONE).toInstant();
        List<Object[]> agg = saleRepository.aggregateReturnsBetween(
            start,
            end,
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
            "from", safeFrom.toString(),
            "to", safeTo.toString(),
            "returnsCount", count,
            "returnsAmount", total
        );
    }

    public Map<String, Object> stockRedistributionSuggestion(
        LocalDate from,
        LocalDate to,
        Integer companyId
    ) {
        LocalDate safeFrom = from != null ? from : LocalDate.now(ZONE).minusDays(30);
        LocalDate safeTo = to != null ? to : LocalDate.now(ZONE);
        long periodDays = Math.max(1, ChronoUnit.DAYS.between(safeFrom, safeTo) + 1L);
        Instant start = safeFrom.atStartOfDay(ZONE).toInstant();
        Instant end = safeTo.plusDays(1).atStartOfDay(ZONE).toInstant();

        List<StoreStock> storeStocks = storeStockRepository.findAllDetailedByCompanyId(companyId);
        List<Object[]> soldRaw = saleItemRepository.soldUnitsByProductAndStore(start, end, companyId);

        Map<UUID, Map<Integer, Integer>> stockByProductStore = new HashMap<>();
        Map<UUID, String> productNameById = new HashMap<>();
        Map<Integer, String> storeNameById = new HashMap<>();

        for (StoreStock ss : storeStocks) {
            UUID productId = ss.getProduct().getId();
            Integer storeId = ss.getStore().getId();
            stockByProductStore.computeIfAbsent(productId, k -> new HashMap<>()).put(storeId, ss.getQuantity());
            productNameById.put(productId, ss.getProduct().getName());
            storeNameById.put(storeId, ss.getStore().getName());
        }

        Map<UUID, Map<Integer, Long>> soldByProductStore = new HashMap<>();
        for (Object[] row : soldRaw) {
            UUID productId = (UUID) row[0];
            Integer storeId = ((Number) row[1]).intValue();
            long sold = ((Number) row[2]).longValue();
            soldByProductStore.computeIfAbsent(productId, k -> new HashMap<>()).put(storeId, sold);
        }

        List<Map<String, Object>> suggestions = new ArrayList<>();

        for (Map.Entry<UUID, Map<Integer, Integer>> e : stockByProductStore.entrySet()) {
            UUID productId = e.getKey();
            Map<Integer, Integer> stocks = e.getValue();
            if (stocks.size() < 2) continue;

            Map<Integer, Long> soldMap = soldByProductStore.getOrDefault(productId, Map.of());

            Integer fromStoreId = null;
            Integer toStoreId = null;
            double maxCoverage = -1;
            double minCoverage = Double.MAX_VALUE;

            for (Map.Entry<Integer, Integer> storeEntry : stocks.entrySet()) {
                Integer storeId = storeEntry.getKey();
                int qty = storeEntry.getValue();
                long sold = soldMap.getOrDefault(storeId, 0L);
                double daily = sold > 0 ? (double) sold / (double) periodDays : 0.0;
                double coverage = daily > 0 ? (double) qty / daily : (qty > 0 ? 9999 : 0);

                if (coverage > maxCoverage) {
                    maxCoverage = coverage;
                    fromStoreId = storeId;
                }
                if (coverage < minCoverage) {
                    minCoverage = coverage;
                    toStoreId = storeId;
                }
            }
            if (fromStoreId == null || toStoreId == null || fromStoreId.equals(toStoreId)) continue;

            int fromQty = stocks.getOrDefault(fromStoreId, 0);
            int toQty = stocks.getOrDefault(toStoreId, 0);
            long soldTo = soldMap.getOrDefault(toStoreId, 0L);
            long soldFrom = soldMap.getOrDefault(fromStoreId, 0L);
            double toDaily = soldTo > 0 ? (double) soldTo / (double) periodDays : 0.0;
            double fromDaily = soldFrom > 0 ? (double) soldFrom / (double) periodDays : 0.0;
            int toNeed = (int) Math.ceil(toDaily * 7.0) - toQty;
            int fromReserve = (int) Math.ceil(fromDaily * 7.0);
            int fromSurplus = Math.max(0, fromQty - fromReserve);
            int suggestedQty = Math.min(Math.max(0, toNeed), fromSurplus);
            if (suggestedQty <= 0) continue;

            Map<String, Object> one = new LinkedHashMap<>();
            one.put("productId", productId);
            one.put("productName", productNameById.getOrDefault(productId, "—"));
            one.put("fromStoreId", fromStoreId);
            one.put("fromStoreName", storeNameById.getOrDefault(fromStoreId, "—"));
            one.put("toStoreId", toStoreId);
            one.put("toStoreName", storeNameById.getOrDefault(toStoreId, "—"));
            one.put("suggestedQty", suggestedQty);
            one.put("fromQty", fromQty);
            one.put("toQty", toQty);
            suggestions.add(one);
        }

        suggestions.sort(Comparator.comparingInt(s -> -((Number) s.get("suggestedQty")).intValue()));
        if (suggestions.size() > 5) {
            suggestions = suggestions.subList(0, 5);
        }

        return Map.of(
            "from", safeFrom.toString(),
            "to", safeTo.toString(),
            "periodDays", periodDays,
            "suggestions", suggestions
        );
    }

    public Map<String, Object> storeSalesAndStockInsight(
        LocalDate from,
        LocalDate to,
        Integer companyId
    ) {
        LocalDate safeFrom = from != null ? from : LocalDate.now(ZONE).minusDays(30);
        LocalDate safeTo = to != null ? to : LocalDate.now(ZONE);
        Instant start = safeFrom.atStartOfDay(ZONE).toInstant();
        Instant end = safeTo.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyIdFinal = companyId;

        CompletableFuture<List<Object[]>> salesRowsF = parallel.supply(
                () -> saleRepository.salesByStoreBetween(start, end, companyIdFinal));
        CompletableFuture<StoreStockIndex> stockIndexF = parallel.supply(
                () -> buildStoreStockIndex(companyIdFinal));
        CompletableFuture<List<Object[]>> soldRawF = parallel.supply(
                () -> saleItemRepository.soldUnitsByProductAndStore(start, end, companyIdFinal));
        AiAssistantParallel.awaitAll(salesRowsF, stockIndexF, soldRawF);

        List<Object[]> salesRows = salesRowsF.join();
        StoreStockIndex stockIndex = stockIndexF.join();
        List<Object[]> soldRaw = soldRawF.join();

        Map<Integer, Long> stockQtyByStore = stockIndex.stockQtyByStore();
        Map<Integer, String> storeNameById = stockIndex.storeNameById();
        Map<String, String> productNameByStoreProduct = stockIndex.productNameByStoreProduct();

        Map<Integer, List<Map<String, Object>>> soldByStore = new HashMap<>();
        for (Object[] row : soldRaw) {
            UUID productId = (UUID) row[0];
            Integer storeId = ((Number) row[1]).intValue();
            long soldUnits = ((Number) row[2]).longValue();
            String productName = productNameByStoreProduct.getOrDefault(storeId + ":" + productId, "—");
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("productName", productName);
            item.put("soldUnits", soldUnits);
            soldByStore.computeIfAbsent(storeId, k -> new ArrayList<>()).add(item);
        }
        soldByStore.values().forEach(list ->
            list.sort((a, b) -> Long.compare(((Number) b.get("soldUnits")).longValue(), ((Number) a.get("soldUnits")).longValue()))
        );

        List<Map<String, Object>> stores = new ArrayList<>();
        List<Map<String, Object>> chart = new ArrayList<>();
        for (Object[] row : salesRows) {
            Integer storeId = row[0] != null ? ((Number) row[0]).intValue() : null;
            String storeName = row[1] != null ? String.valueOf(row[1]) : storeNameById.getOrDefault(storeId, "—");
            Object revenue = row[2];
            long checks = row[3] != null ? ((Number) row[3]).longValue() : 0L;
            long stockQty = storeId != null ? stockQtyByStore.getOrDefault(storeId, 0L) : 0L;
            List<Map<String, Object>> topProducts = soldByStore.getOrDefault(storeId, List.of())
                .stream()
                .limit(3)
                .toList();

            Map<String, Object> one = new LinkedHashMap<>();
            one.put("storeId", storeId);
            one.put("storeName", storeName);
            one.put("revenue", revenue);
            one.put("checks", checks);
            one.put("stockQty", stockQty);
            one.put("topProducts", topProducts);
            stores.add(one);

            Map<String, Object> point = new LinkedHashMap<>();
            point.put("name", storeName);
            point.put("revenue", revenue);
            point.put("stockQty", stockQty);
            chart.add(point);
        }

        return Map.of(
            "from", safeFrom.toString(),
            "to", safeTo.toString(),
            "stores", stores,
            "chart", chart
        );
    }

    public Map<String, Object> businessHealthCheck(LocalDate from, LocalDate to, Integer companyId) {
        LocalDate safeFrom = from != null ? from : LocalDate.now(ZONE).minusDays(29);
        LocalDate safeTo = to != null ? to : LocalDate.now(ZONE);
        long days = Math.max(1, ChronoUnit.DAYS.between(safeFrom, safeTo) + 1);
        LocalDate prevTo = safeFrom.minusDays(1);
        LocalDate prevFrom = prevTo.minusDays(days - 1);
        Integer companyIdFinal = companyId;

        CompletableFuture<SalesReportResponse> currentF = parallel.supply(
                () -> reportService.getSalesReport(safeFrom, safeTo));
        CompletableFuture<SalesReportResponse> previousF = parallel.supply(
                () -> reportService.getSalesReport(prevFrom, prevTo));
        CompletableFuture<Map<String, Object>> returnsF = parallel.supply(
                () -> returnsSummaryPeriod(safeFrom, safeTo, companyIdFinal));
        CompletableFuture<Map<String, Object>> topProductsF = parallel.supply(
                () -> topProductsPeriod(safeFrom, safeTo, 5));
        CompletableFuture<Map<String, Object>> storeInsightF = parallel.supply(
                () -> storeChartSummary(safeFrom, safeTo, companyIdFinal));
        AiAssistantParallel.awaitAll(currentF, previousF, returnsF, topProductsF, storeInsightF);

        SalesReportResponse current = currentF.join();
        SalesReportResponse previous = previousF.join();
        Map<String, Object> returns = returnsF.join();
        Map<String, Object> topProducts = topProductsF.join();
        Map<String, Object> storeInsight = storeInsightF.join();

        BigDecimal curRevenue = current.totalRevenue() != null ? current.totalRevenue() : BigDecimal.ZERO;
        BigDecimal prevRevenue = previous.totalRevenue() != null ? previous.totalRevenue() : BigDecimal.ZERO;
        BigDecimal delta = curRevenue.subtract(prevRevenue);
        BigDecimal returnsAmount = returns.get("returnsAmount") instanceof BigDecimal b ? b : BigDecimal.ZERO;
        long returnsCount = returns.get("returnsCount") instanceof Number n ? n.longValue() : 0L;
        long lowStockCount = productRepository.countLowStockByCompanyId(companyIdFinal);

        // Normalize top products to a map structure (items may be TopProductRow DTOs)
        List<Map<String, Object>> topItems = new ArrayList<>();
        Object rawTopItems = topProducts.get("items");
        if (rawTopItems instanceof List<?> rows) {
            for (Object row : rows) {
                if (row instanceof Map<?, ?> map) {
                    Map<String, Object> one = new LinkedHashMap<>();
                    one.put("productName", map.get("productName"));
                    one.put("quantitySold", map.get("quantitySold"));
                    one.put("revenue", map.get("revenue"));
                    topItems.add(one);
                } else if (row instanceof TopProductRow dto) {
                    Map<String, Object> one = new LinkedHashMap<>();
                    one.put("productName", dto.productName());
                    one.put("quantitySold", dto.quantitySold());
                    one.put("revenue", null);
                    topItems.add(one);
                }
            }
        }

        // Enhanced: find specific products with potential decline
        List<Map<String, Object>> decliningProducts = new ArrayList<>();
        if (!topItems.isEmpty()) {
            // In real implementation, you'd compare with previous period
            // Here we'll just mark products with potential issues
            for (Map<String, Object> item : topItems) {
                // This is simplified - in production, compare with historical data
                Object revenue = item.get("revenue");
                Object quantitySold = item.get("quantitySold");
                if ((revenue instanceof Number && ((Number) revenue).doubleValue() < 1000)
                        || (quantitySold instanceof Number && ((Number) quantitySold).longValue() < 10)) {
                    decliningProducts.add(item);
                }
            }
        }

        // Enhanced: find stores with low stock but high sales
        List<Map<String, Object>> storesWithIssues = new ArrayList<>();
        Object storesRaw = storeInsight.get("stores");
        if (storesRaw instanceof List) {
            for (Object storeObj : (List<?>) storesRaw) {
                if (storeObj instanceof Map) {
                    Map<?, ?> store = (Map<?, ?>) storeObj;
                    Number stockQty = (Number) store.get("stockQty");
                    Number revenue = (Number) store.get("revenue");
                    String storeName = String.valueOf(store.get("storeName"));

                    if (stockQty != null && revenue != null &&
                            stockQty.longValue() < 50 && revenue.doubleValue() > 5000) {
                        Map<String, Object> issue = new LinkedHashMap<>();
                        issue.put("storeName", storeName);
                        issue.put("stockQty", stockQty);
                        issue.put("revenue", revenue);
                        storesWithIssues.add(issue);
                    }
                }
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("from", safeFrom.toString());
        out.put("to", safeTo.toString());
        out.put("previousFrom", prevFrom.toString());
        out.put("previousTo", prevTo.toString());
        out.put("currentRevenue", curRevenue);
        out.put("previousRevenue", prevRevenue);
        out.put("revenueDelta", delta);
        out.put("returnsAmount", returnsAmount);
        out.put("returnsCount", returnsCount);
        out.put("lowStockCount", lowStockCount);
        out.put("topProducts", topItems);
        out.put("decliningProducts", decliningProducts);
        out.put("storesWithLowStockButHighSales", storesWithIssues);
        out.put("storeChart", storeInsight.getOrDefault("chart", List.of()));
        out.put("storeSuggestions", List.of());

        // Keep simple actions as fallback for when LLM fails
        List<String> simpleActions = new ArrayList<>();
        if (delta.compareTo(BigDecimal.ZERO) < 0 && !decliningProducts.isEmpty()) {
            Map<String, Object> firstDeclining = decliningProducts.get(0);
            simpleActions.add("Sales declined. Check " + firstDeclining.get("productName") + " - it underperformed.");
        } else if (delta.compareTo(BigDecimal.ZERO) > 0) {
            simpleActions.add("Revenue growing. Focus on top performers.");
        }
        if (!storesWithIssues.isEmpty()) {
            Map<String, Object> firstIssue = storesWithIssues.get(0);
            simpleActions.add(firstIssue.get("storeName") + " has low stock (" + firstIssue.get("stockQty") +
                    ") but good sales (" + firstIssue.get("revenue") + "). Restock urgently.");
        }
        if (returnsCount > 0) {
            simpleActions.add("Returns detected. Review return reasons.");
        }

        out.put("recommendedActions", simpleActions);
        out.put("chart", storeInsight.getOrDefault("chart", List.of()));
        return out;
    }

    /** Lightweight store chart for health check (no per-product breakdown). */
    private Map<String, Object> storeChartSummary(LocalDate safeFrom, LocalDate safeTo, Integer companyId) {
        Instant start = safeFrom.atStartOfDay(ZONE).toInstant();
        Instant end = safeTo.plusDays(1).atStartOfDay(ZONE).toInstant();

        CompletableFuture<List<Object[]>> salesRowsF = parallel.supply(
                () -> saleRepository.salesByStoreBetween(start, end, companyId));
        CompletableFuture<StoreStockIndex> stockIndexF = parallel.supply(
                () -> buildStoreStockIndex(companyId));
        AiAssistantParallel.awaitAll(salesRowsF, stockIndexF);

        List<Object[]> salesRows = salesRowsF.join();
        StoreStockIndex stockIndex = stockIndexF.join();
        Map<Integer, Long> stockQtyByStore = stockIndex.stockQtyByStore();
        Map<Integer, String> storeNameById = stockIndex.storeNameById();

        List<Map<String, Object>> stores = new ArrayList<>();
        List<Map<String, Object>> chart = new ArrayList<>();
        for (Object[] row : salesRows) {
            Integer storeId = row[0] != null ? ((Number) row[0]).intValue() : null;
            String storeName = row[1] != null ? String.valueOf(row[1]) : storeNameById.getOrDefault(storeId, "—");
            Object revenue = row[2];
            long checks = row[3] != null ? ((Number) row[3]).longValue() : 0L;
            long stockQty = storeId != null ? stockQtyByStore.getOrDefault(storeId, 0L) : 0L;

            Map<String, Object> one = new LinkedHashMap<>();
            one.put("storeId", storeId);
            one.put("storeName", storeName);
            one.put("revenue", revenue);
            one.put("checks", checks);
            one.put("stockQty", stockQty);
            stores.add(one);

            Map<String, Object> point = new LinkedHashMap<>();
            point.put("name", storeName);
            point.put("revenue", revenue);
            point.put("stockQty", stockQty);
            chart.add(point);
        }
        return Map.of("stores", stores, "chart", chart);
    }

    public Map<String, Object> executiveSystemOverview(LocalDate from, LocalDate to, Integer companyId) {
        LocalDate safeFrom = from != null ? from : LocalDate.now(ZONE).minusDays(30);
        LocalDate safeTo = to != null ? to : LocalDate.now(ZONE);
        Instant start = safeFrom.atStartOfDay(ZONE).toInstant();
        Instant end = safeTo.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyIdFinal = companyId;

        CompletableFuture<SalesReportResponse> salesF = parallel.supply(
                () -> reportService.getSalesReport(safeFrom, safeTo));
        CompletableFuture<List<TopProductRow>> topProductsF = parallel.supply(
                () -> reportService.getTopProducts(5, safeFrom, safeTo));
        CompletableFuture<List<Object[]>> storesRawF = parallel.supply(
                () -> saleRepository.salesByStoreBetween(start, end, companyIdFinal));
        CompletableFuture<Long> productCountF = parallel.supply(
                () -> productRepository.countActiveByCompanyId(companyIdFinal));
        CompletableFuture<Long> lowStockCountF = parallel.supply(
                () -> productRepository.countLowStockByCompanyId(companyIdFinal));
        CompletableFuture<Long> categoryCountF = parallel.supply(
                () -> categoryRepository.countByCompanyId(companyIdFinal));
        CompletableFuture<Long> storeCountF = parallel.supply(
                () -> storeRepository.countByCompanyId(companyIdFinal));
        CompletableFuture<Long> activeStoreCountF = parallel.supply(
                () -> storeRepository.countByCompanyIdAndActiveTrue(companyIdFinal));
        CompletableFuture<Object[]> zSummaryF = parallel.supply(
                () -> zReportRepository.summarizeByCompanyAndClosedAtBetween(companyIdFinal, start, end));
        CompletableFuture<Long> zTotalF = parallel.supply(
                () -> zReportRepository.countByCompanyId(companyIdFinal));
        CompletableFuture<Map<String, Object>> returnsF = parallel.supply(
                () -> returnsSummaryPeriod(safeFrom, safeTo, companyIdFinal));
        AiAssistantParallel.awaitAll(
                salesF, topProductsF, storesRawF, productCountF, lowStockCountF,
                categoryCountF, storeCountF, activeStoreCountF, zSummaryF, zTotalF, returnsF);

        SalesReportResponse sales = salesF.join();
        List<TopProductRow> topProducts = topProductsF.join();
        List<Object[]> storesRaw = storesRawF.join();
        List<Map<String, Object>> topStores = storesRaw.stream()
                .sorted((a, b) -> Double.compare(toDouble(b[2]), toDouble(a[2])))
                .limit(5)
                .map(row -> {
                    Map<String, Object> one = new LinkedHashMap<>();
                    one.put("storeId", row[0] != null ? ((Number) row[0]).intValue() : null);
                    one.put("storeName", row[1] != null ? String.valueOf(row[1]) : "—");
                    one.put("revenue", row[2]);
                    one.put("checks", row[3] != null ? ((Number) row[3]).longValue() : 0L);
                    return one;
                })
                .toList();

        long productCount = productCountF.join();
        long lowStockCount = lowStockCountF.join();
        long categoryCount = categoryCountF.join();
        long storeCount = storeCountF.join();
        long activeStoreCount = activeStoreCountF.join();

        Object[] zSummary = zSummaryF.join();
        long zReportsCount = zSummary != null && zSummary.length > 0 && zSummary[0] instanceof Number n ? n.longValue() : 0L;
        BigDecimal zReportsTotal = zSummary != null && zSummary.length > 1 && zSummary[1] instanceof BigDecimal b ? b : BigDecimal.ZERO;
        long zReportsTotalInSystem = zTotalF.join();

        Map<String, Object> returns = returnsF.join();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("from", safeFrom.toString());
        out.put("to", safeTo.toString());
        out.put("sales", AiAnalyticsMaps.salesBlock(sales));
        Map<String, Object> returnsBlock = AiAnalyticsMaps.create();
        returnsBlock.put("count", returns.get("returnsCount"));
        returnsBlock.put("amount", AiAnalyticsMaps.safe(returns.get("returnsAmount")));
        out.put("returns", returnsBlock);
        out.put("catalog", Map.of(
                "products", productCount,
                "categories", categoryCount,
                "lowStockProducts", lowStockCount
        ));
        out.put("stores", Map.of(
                "total", storeCount,
                "active", activeStoreCount,
                "withSales", storesRaw.size(),
                "top", topStores
        ));
        Map<String, Object> zReportsBlock = AiAnalyticsMaps.create();
        zReportsBlock.put("countInPeriod", zReportsCount);
        zReportsBlock.put("totalAmountInPeriod", zReportsTotal);
        zReportsBlock.put("totalInSystem", zReportsTotalInSystem);
        out.put("zReports", zReportsBlock);
        out.put("topProducts", topProducts);
        return out;
    }

    private double toDouble(Object value) {
        if (value instanceof Number n) return n.doubleValue();
        return 0d;
    }

    private InventorySlice loadInventorySlice(Integer companyId, Instant start, Instant end) {
        var page = stockInventoryRepository.findByCompanyBetween(companyId, start, end, PageRequest.of(0, 10));
        List<Map<String, Object>> recent = page.getContent().stream()
                .map(this::toInventoryRow)
                .toList();
        return new InventorySlice(page.getTotalElements(), recent);
    }

    private List<Map<String, Object>> loadLowStockRows(Integer companyId) {
        return productRepository.findLowStockProductsByCompanyId(companyId, PageRequest.of(0, 15)).stream()
                .map(p -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("productName", p.getName());
                    row.put("stockQty", p.getStockQuantity());
                    row.put("lowStockAlert", p.getLowStockAlert());
                    return row;
                })
                .toList();
    }

    private StoreStockIndex buildStoreStockIndex(Integer companyId) {
        List<StoreStock> storeStocks = storeStockRepository.findAllDetailedByCompanyId(companyId);
        Map<Integer, Long> stockQtyByStore = new HashMap<>();
        Map<Integer, String> storeNameById = new HashMap<>();
        Map<String, String> productNameByStoreProduct = new HashMap<>();
        for (StoreStock ss : storeStocks) {
            Integer storeId = ss.getStore().getId();
            UUID productId = ss.getProduct().getId();
            stockQtyByStore.merge(storeId, (long) ss.getQuantity(), Long::sum);
            storeNameById.put(storeId, ss.getStore().getName());
            productNameByStoreProduct.put(storeId + ":" + productId, ss.getProduct().getName());
        }
        return new StoreStockIndex(stockQtyByStore, storeNameById, productNameByStoreProduct);
    }

    private record InventorySlice(long count, List<Map<String, Object>> recent) {
    }

    private record StoreStockIndex(
            Map<Integer, Long> stockQtyByStore,
            Map<Integer, String> storeNameById,
            Map<String, String> productNameByStoreProduct
    ) {
    }
}

