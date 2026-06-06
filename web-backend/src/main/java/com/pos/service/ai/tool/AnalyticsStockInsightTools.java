package com.pos.service.ai.tool;

import com.pos.entity.StoreStock;
import com.pos.repository.StoreStockRepository;
import com.pos.repository.sale.SaleAggregateRepository;
import com.pos.service.ai.AiAssistantParallel;
import com.pos.service.ai.support.AnalyticsPeriodSupport;
import com.pos.service.ai.support.AnalyticsStoreStockSupport;
import com.pos.service.ai.support.AnalyticsStoreStockSupport.StoreStockIndex;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static com.pos.service.ai.support.AnalyticsPeriodSupport.ZONE;
import static com.pos.service.ai.support.AnalyticsPeriodSupport.period;

@Component
@RequiredArgsConstructor
public class AnalyticsStockInsightTools {

    private final StoreStockRepository storeStockRepository;
    private final SaleAggregateRepository saleAggregateRepository;
    private final AnalyticsStoreStockSupport storeStockSupport;
    private final AiAssistantParallel parallel;

    public Map<String, Object> stockRedistributionSuggestion(LocalDate from, LocalDate to, Integer companyId) {
        AnalyticsPeriodSupport.Period range = period(from, to, 30);
        long periodDays = Math.max(1, ChronoUnit.DAYS.between(range.from(), range.to()) + 1L);

        List<StoreStock> storeStocks = storeStockRepository.findAllDetailedByCompanyId(companyId);
        List<Object[]> soldRaw = saleAggregateRepository.soldUnitsByProductAndStore(
            range.start(), range.end(), companyId
        );

        Map<UUID, Map<Integer, Integer>> stockByProductStore = new HashMap<>();
        Map<UUID, String> productNameById = new HashMap<>();
        Map<Integer, String> storeNameById = new HashMap<>();

        for (StoreStock ss : storeStocks) {
            UUID productId = ss.getProduct().getId();
            Integer storeId = ss.getStore().getId();
            stockByProductStore.computeIfAbsent(productId, k -> new HashMap<>())
                .put(storeId, ss.getQuantity().intValue());
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

        List<Map<String, Object>> suggestions = buildRedistributionSuggestions(
            stockByProductStore,
            soldByProductStore,
            productNameById,
            storeNameById,
            periodDays
        );

        return Map.of(
            "from", range.from().toString(),
            "to", range.to().toString(),
            "periodDays", periodDays,
            "suggestions", suggestions
        );
    }

    public Map<String, Object> storeSalesAndStockInsight(LocalDate from, LocalDate to, Integer companyId) {
        AnalyticsPeriodSupport.Period range = period(from, to, 30);

        CompletableFuture<List<Object[]>> salesRowsF = parallel.supply(
            () -> saleAggregateRepository.salesByStoreBetween(range.start(), range.end(), companyId)
        );
        CompletableFuture<StoreStockIndex> stockIndexF = parallel.supply(
            () -> storeStockSupport.buildIndex(companyId)
        );
        CompletableFuture<List<Object[]>> soldRawF = parallel.supply(
            () -> saleAggregateRepository.soldUnitsByProductAndStore(range.start(), range.end(), companyId)
        );
        AiAssistantParallel.awaitAll(salesRowsF, stockIndexF, soldRawF);

        return buildStoreInsightResponse(
            range.from(),
            range.to(),
            salesRowsF.join(),
            stockIndexF.join(),
            soldRawF.join()
        );
    }

    public Map<String, Object> storeChartSummary(LocalDate safeFrom, LocalDate safeTo, Integer companyId) {
        Instant start = safeFrom.atStartOfDay(ZONE).toInstant();
        Instant end = safeTo.plusDays(1).atStartOfDay(ZONE).toInstant();

        CompletableFuture<List<Object[]>> salesRowsF = parallel.supply(
            () -> saleAggregateRepository.salesByStoreBetween(start, end, companyId)
        );
        CompletableFuture<StoreStockIndex> stockIndexF = parallel.supply(
            () -> storeStockSupport.buildIndex(companyId)
        );
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

    private Map<String, Object> buildStoreInsightResponse(
        LocalDate from,
        LocalDate to,
        List<Object[]> salesRows,
        StoreStockIndex stockIndex,
        List<Object[]> soldRaw
    ) {
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
            list.sort((a, b) -> Long.compare(
                ((Number) b.get("soldUnits")).longValue(),
                ((Number) a.get("soldUnits")).longValue()
            ))
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
            "from", from.toString(),
            "to", to.toString(),
            "stores", stores,
            "chart", chart
        );
    }

    private static List<Map<String, Object>> buildRedistributionSuggestions(
        Map<UUID, Map<Integer, Integer>> stockByProductStore,
        Map<UUID, Map<Integer, Long>> soldByProductStore,
        Map<UUID, String> productNameById,
        Map<Integer, String> storeNameById,
        long periodDays
    ) {
        List<Map<String, Object>> suggestions = new ArrayList<>();

        for (Map.Entry<UUID, Map<Integer, Integer>> e : stockByProductStore.entrySet()) {
            UUID productId = e.getKey();
            Map<Integer, Integer> stocks = e.getValue();
            if (stocks.size() < 2) {
                continue;
            }

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
            if (fromStoreId == null || toStoreId == null || fromStoreId.equals(toStoreId)) {
                continue;
            }

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
            if (suggestedQty <= 0) {
                continue;
            }

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
            return suggestions.subList(0, 5);
        }
        return suggestions;
    }
}
