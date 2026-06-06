package com.pos.service.ai;

import com.pos.entity.Product;
import com.pos.repository.spec.ProductSpecifications;
import com.pos.service.support.ProductLookupSupport;
import com.pos.service.product.ProductLifecycleService;
import com.pos.service.stock.StockReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Единая точка доступа к данным аналитики компании для AI-ассистента.
 * Кэширует тяжелые overview-ответы и делегирует остальные tool-метрики в AnalyticsToolFacade.
 */
@Component
@RequiredArgsConstructor
public class AiAssistantCompanyRepository {

    private static final long TTL_MS = 90_000L;

    private final AnalyticsToolFacade toolFacade;
    private final StockReportService stockReportService;
    private final ProductLifecycleService productLifecycleService;
    private final ProductLookupSupport productLookup;

    private final ConcurrentHashMap<String, CachedOverview> overviewCache = new ConcurrentHashMap<>();

    public Map<String, Object> executiveOverview(LocalDate from, LocalDate to, Integer companyId) {
        String key = "exec|" + companyId + "|" + from + "|" + to;
        return cached(key, () -> toolFacade.executiveSystemOverview(from, to, companyId));
    }

    public Map<String, Object> zReportsOverview(LocalDate from, LocalDate to, Integer companyId) {
        String key = "z|" + companyId + "|" + from + "|" + to;
        return cached(key, () -> toolFacade.zReportsOverview(from, to, companyId));
    }

    public Map<String, Object> todayRevenue(Integer companyId) {
        return toolFacade.todayRevenue(companyId);
    }

    public Map<String, Object> salesPeriodOverview(LocalDate from, LocalDate to, Integer companyId) {
        return toolFacade.salesPeriodOverview(from, to, companyId);
    }

    public Map<String, Object> inventoryOverview(LocalDate from, LocalDate to, Integer companyId) {
        return toolFacade.inventoryOverview(from, to, companyId);
    }

    public Map<String, Object> topProductsPeriod(LocalDate from, LocalDate to, int limit) {
        return toolFacade.topProductsPeriod(from, to, limit);
    }

    public Map<String, Object> returnsSummaryPeriod(LocalDate from, LocalDate to, Integer companyId) {
        return toolFacade.returnsSummaryPeriod(from, to, companyId);
    }

    public Map<String, Object> stockRedistributionSuggestion(LocalDate from, LocalDate to, Integer companyId) {
        return toolFacade.stockRedistributionSuggestion(from, to, companyId);
    }

    public Map<String, Object> storeSalesAndStockInsight(LocalDate from, LocalDate to, Integer companyId) {
        return toolFacade.storeSalesAndStockInsight(from, to, companyId);
    }

    public Map<String, Object> businessHealthCheck(LocalDate from, LocalDate to, Integer companyId) {
        return toolFacade.businessHealthCheck(from, to, companyId);
    }

    /**
     * Унифицированный доступ к "отчётам" ассистента (tool results).
     * Это гарантирует, что все инструменты идут через один репозиторий и их легко расширять.
     */
    public Map<String, Object> runTool(
        String tool,
        LocalDate from,
        LocalDate to,
        String query,
        Integer companyId,
        int limit
    ) {
        return switch (tool) {
            case com.pos.service.ai.impl.AiAssistantToolCatalog.TODAY_REVENUE -> todayRevenue(companyId);
            case com.pos.service.ai.impl.AiAssistantToolCatalog.SALES_PERIOD -> salesPeriodOverview(from, to, companyId);
            case com.pos.service.ai.impl.AiAssistantToolCatalog.INVENTORY -> inventoryOverview(from, to, companyId);
            case com.pos.service.ai.impl.AiAssistantToolCatalog.Z_REPORTS ->
                zReportsOverview(from != null ? from : LocalDate.now().minusDays(90), to, companyId);
            case com.pos.service.ai.impl.AiAssistantToolCatalog.TOP_PRODUCTS -> topProductsPeriod(from, to, limit);
            case com.pos.service.ai.impl.AiAssistantToolCatalog.RETURNS_SUMMARY -> returnsSummaryPeriod(from, to, companyId);
            case com.pos.service.ai.impl.AiAssistantToolCatalog.REDISTRIBUTION -> stockRedistributionSuggestion(from, to, companyId);
            case com.pos.service.ai.impl.AiAssistantToolCatalog.STORE_INSIGHT -> storeSalesAndStockInsight(from, to, companyId);
            case com.pos.service.ai.impl.AiAssistantToolCatalog.BUSINESS_HEALTH -> businessHealthCheck(from, to, companyId);
            case com.pos.service.ai.impl.AiAssistantToolCatalog.LOW_STOCK -> lowStockOverview(limit);
            case com.pos.service.ai.impl.AiAssistantToolCatalog.STOCK_TURNOVER -> stockTurnoverOverview(from, to, query, limit);
            case com.pos.service.ai.impl.AiAssistantToolCatalog.PRODUCT_SALES -> productSalesOverview(from, to, query, limit);
            case com.pos.service.ai.impl.AiAssistantToolCatalog.DEAD_STOCK -> deadStockOverview(to, query, limit);
            case com.pos.service.ai.impl.AiAssistantToolCatalog.PRODUCT_LIFECYCLE ->
                productLifecycleOverview(companyId, from, to, query);
            default -> throw new IllegalArgumentException("Unknown tool: " + tool);
        };
    }

    private Map<String, Object> lowStockOverview(int limit) {
        int size = Math.max(1, Math.min(200, limit > 0 ? limit : 30));
        var page = stockReportService.lowStock(PageRequest.of(0, size));
        return Map.of(
            "count", page.totalElements(),
            "items", page.content()
        );
    }

    private Map<String, Object> stockTurnoverOverview(LocalDate from, LocalDate to, String query, int limit) {
        LocalDate start = from != null ? from : LocalDate.now().minusDays(30);
        LocalDate end = to != null ? to : LocalDate.now();
        int size = Math.max(1, Math.min(200, limit > 0 ? limit : 30));
        var page = stockReportService.turnover(start, end, null, query, PageRequest.of(0, size));
        return Map.of(
            "from", start,
            "to", end,
            "count", page.totalElements(),
            "items", page.content()
        );
    }

    private Map<String, Object> productSalesOverview(LocalDate from, LocalDate to, String query, int limit) {
        LocalDate start = from != null ? from : LocalDate.now().minusDays(30);
        LocalDate end = to != null ? to : LocalDate.now();
        int size = Math.max(1, Math.min(200, limit > 0 ? limit : 30));
        var page = stockReportService.productSales(start, end, null, null, query, PageRequest.of(0, size));
        return Map.of(
            "from", start,
            "to", end,
            "count", page.totalElements(),
            "items", page.content()
        );
    }

    private Map<String, Object> deadStockOverview(LocalDate asOf, String query, int limit) {
        LocalDate date = asOf != null ? asOf : LocalDate.now();
        int size = Math.max(1, Math.min(200, limit > 0 ? limit : 30));
        int daysNoSale = 30;
        var page = stockReportService.deadStock(date, daysNoSale, null, query, PageRequest.of(0, size));
        return Map.of(
            "asOfDate", date,
            "daysNoSale", daysNoSale,
            "count", page.totalElements(),
            "items", page.content()
        );
    }

    private Map<String, Object> productLifecycleOverview(
        Integer companyId,
        LocalDate from,
        LocalDate to,
        String query
    ) {
        if (query == null || query.isBlank()) {
            return Map.of(
                "error",
                "Укажи SKU/артикул/название товара. Пример: \"жизненный цикл товара sku:ABC-123\""
            );
        }

        Optional<UUID> productId = resolveProductId(companyId, query.trim());
        if (productId.isEmpty()) {
            return Map.of("error", "Товар не найден по query=" + query);
        }

        var response = productLifecycleService.lifecycle(
            productId.get(),
            from,
            to,
            null,
            null,
            PageRequest.of(0, 30)
        );

        return Map.of(
            "productId", productId.get(),
            "summary", response.summary(),
            "events", response.events()
        );
    }

    private Optional<UUID> resolveProductId(Integer companyId, String query) {
        try {
            UUID id = UUID.fromString(query);
            return Optional.of(id);
        } catch (Exception ignored) {
        }

        Optional<Product> bySku = productLookup.findOne(
            ProductSpecifications.lookup(companyId).sku(query)
        );
        if (bySku.isPresent()) {
            return bySku.map(Product::getId);
        }

        return productLookup.findOne(
            ProductSpecifications.lookup(companyId).nameIgnoreCase(query)
        ).map(Product::getId);
    }

    private Map<String, Object> cached(String key, java.util.function.Supplier<Map<String, Object>> loader) {
        long now = System.currentTimeMillis();
        CachedOverview hit = overviewCache.get(key);
        if (hit != null && hit.expiresAtMs > now) {
            return hit.overview;
        }
        Map<String, Object> fresh = loader.get();
        overviewCache.put(key, new CachedOverview(fresh, now + TTL_MS));
        return fresh;
    }

    private record CachedOverview(Map<String, Object> overview, long expiresAtMs) {
    }
}

