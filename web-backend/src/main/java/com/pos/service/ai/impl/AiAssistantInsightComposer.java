package com.pos.service.ai.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.dto.report.TopProductRow;
import com.pos.config.AiAssistantProperties;
import com.pos.dto.ai.AiAssistantChatMessage;
import com.pos.exception.BadRequestException;
import com.pos.service.ai.DeepSeekClient;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
class AiAssistantInsightComposer {

    private static final int TOP_CHAT_ITEMS = 5;
    private static final boolean STRICT_DATA_MODE = false;

    private final DeepSeekClient deepSeekClient;
    private final ObjectMapper objectMapper;
    private final AiAssistantProperties properties;

    String compose(
            String question,
            String language,
            String tool,
            Map<String, Object> toolResult,
            List<AiAssistantChatMessage> history
    ) {
        String fallback = buildFallbackAnswer(tool, toolResult, language);
        if (STRICT_DATA_MODE || !properties.isLlmReady()) {
            if (!properties.isLlmReady()) {
                return fallback + "\n\n" + AiAssistantOfflineReply.notConfigured(language);
            }
            return fallback;
        }
        try {
            String system = AiAssistantPrompts.insightSystem(language, tool);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", system));
            messages.add(Map.of("role", "user", "content", "DATA: " + enrichToolResultForLlm(tool, toolResult)));
            AiAssistantConversationHistory.appendToLlmMessages(messages, history);
            messages.add(Map.of("role", "user", "content", question));

            String content = deepSeekClient.chat(messages);
            return StringUtils.hasText(content) ? content.trim() : fallback;
        } catch (BadRequestException e) {
            LogUtil.warn(AiAssistantInsightComposer.class, "LLM summarization failed: {}", e.getMessage());
            return fallback + "\n\n(" + e.getMessage() + ")";
        } catch (Exception e) {
            LogUtil.warn(AiAssistantInsightComposer.class, "LLM summarization failed: {}", e.getMessage());
            return fallback;
        }
    }

    private String enrichToolResultForLlm(String tool, Map<String, Object> toolResult) {
        try {
            Map<String, Object> enriched = new LinkedHashMap<>(toolResult);
            if (AiAssistantToolCatalog.BUSINESS_HEALTH.equals(tool)) {
                Object topProducts = toolResult.get("topProducts");
                if (topProducts instanceof List<?> list && !list.isEmpty()) {
                    enriched.put("topProductsSummary", extractTopProductsSummary(list));
                }
                Object storeChart = toolResult.get("storeChart");
                if (storeChart instanceof List<?> list && !list.isEmpty()) {
                    enriched.put("storesWithIssuesSummary", extractStoresWithIssues(list));
                }
                Object storeSuggestions = toolResult.get("storeSuggestions");
                if (storeSuggestions instanceof List<?> list && !list.isEmpty()) {
                    enriched.put("redistributionNeeded", list.size() + " transfer suggestions available");
                }
            }
            if (AiAssistantToolCatalog.TOP_PRODUCTS.equals(tool)) {
                Object items = toolResult.get("items");
                if (items instanceof List<?> list && !list.isEmpty()) {
                    enriched.put("totalProductsCount", list.size());
                    enriched.put("topProductName", extractTopProductName(list));
                }
            }
            if (AiAssistantToolCatalog.STORE_INSIGHT.equals(tool)) {
                Object stores = toolResult.get("stores");
                if (stores instanceof List<?> list) {
                    enriched.put("storesCount", list.size());
                    enriched.put("worstPerformingStore", extractWorstStore(list));
                    enriched.put("bestPerformingStore", extractBestStore(list));
                }
            }
            return objectMapper.writeValueAsString(enriched);
        } catch (Exception e) {
            try {
                return objectMapper.writeValueAsString(toolResult);
            } catch (Exception ex) {
                return toolResult.toString();
            }
        }
    }

    private String buildFallbackAnswer(String tool, Map<String, Object> result, String language) {
        return switch (tool) {
            case AiAssistantToolCatalog.TODAY_REVENUE -> formatTodayRevenueFallback(result, language);
            case AiAssistantToolCatalog.SALES_PERIOD -> formatSalesPeriodFallback(result, language);
            case AiAssistantToolCatalog.TOP_PRODUCTS -> formatTopProductsFallback(result, language);
            case AiAssistantToolCatalog.INVENTORY -> formatInventoryFallback(result, language);
            case AiAssistantToolCatalog.RETURNS_SUMMARY -> formatReturnsFallback(result, language);
            case AiAssistantToolCatalog.REDISTRIBUTION -> formatRedistributionFallback(result, language);
            case AiAssistantToolCatalog.STORE_INSIGHT -> formatStoreInsightFallback(result, language);
            case AiAssistantToolCatalog.BUSINESS_HEALTH -> formatBusinessHealthFallback(result, language);
            default -> "en".equals(language)
                    ? "Ready to help with sales and stock analytics."
                    : "Готов помочь с аналитикой продаж и склада.";
        };
    }

    private String formatSalesPeriodFallback(Map<String, Object> result, String language) {
        if ("en".equals(language)) {
            return String.format("Sales %s..%s: revenue %s, checks %s, avg check %s.",
                    result.get("from"), result.get("to"), result.get("revenue"),
                    result.get("transactions"), result.get("averageCheck"));
        }
        return String.format("Продажи %s..%s: выручка %s, чеков %s, средний чек %s.",
                result.get("from"), result.get("to"), result.get("revenue"),
                result.get("transactions"), result.get("averageCheck"));
    }

    private String formatInventoryFallback(Map<String, Object> result, String language) {
        long count = result.get("inventoriesCount") instanceof Number n ? n.longValue() : 0L;
        Object recentRaw = result.get("recentInventories");
        String recent = "—";
        if (recentRaw instanceof List<?> list && !list.isEmpty()) {
            recent = list.stream().limit(5).map(this::formatInventoryLine).collect(Collectors.joining("; "));
        }
        if ("en".equals(language)) {
            return String.format("Inventories %s..%s: %d documents. Recent: %s. Low stock SKUs: %s.",
                    result.get("from"), result.get("to"), count, recent, result.get("lowStockCount"));
        }
        return String.format("Инвентаризация %s..%s: документов %d. Последние: %s. Товаров с низким остатком: %s.",
                result.get("from"), result.get("to"), count, recent, result.get("lowStockCount"));
    }

    private String formatInventoryLine(Object raw) {
        if (!(raw instanceof Map<?, ?> row)) return "—";
        return safeText(row.get("inventoryNumber")) + " / " + safeText(row.get("storeName"))
                + " (расх. " + safeText(row.get("totalDifference")) + ")";
    }

    private String formatTodayRevenueFallback(Map<String, Object> result, String language) {
        if ("en".equals(language)) {
            return String.format("Today's revenue for %s is %s, checks: %s, average check: %s.",
                    result.get("date"), result.get("totalRevenue"), result.get("transactionCount"), result.get("averageCheck"));
        }
        return String.format("За %s выручка: %s, чеков: %s, средний чек: %s.",
                result.get("date"), result.get("totalRevenue"), result.get("transactionCount"), result.get("averageCheck"));
    }

    private String formatTopProductsFallback(Map<String, Object> result, String language) {
        Object rawItems = result.get("items");
        if (!(rawItems instanceof List<?> items) || items.isEmpty()) {
            return "en".equals(language)
                    ? String.format("No top products found for %s..%s.", result.get("from"), result.get("to"))
                    : String.format("За период %s..%s топ товаров не найден.", result.get("from"), result.get("to"));
        }
        String top = items.stream().limit(3).map(this::formatTopItem).collect(Collectors.joining("; "));
        return "en".equals(language)
                ? String.format("Top products for %s..%s: %s.", result.get("from"), result.get("to"), top)
                : String.format("Топ товаров за %s..%s: %s.", result.get("from"), result.get("to"), top);
    }

    private String formatReturnsFallback(Map<String, Object> result, String language) {
        return "en".equals(language)
                ? String.format("Returns for %s..%s: %s, amount: %s.",
                result.get("from"), result.get("to"), result.get("returnsCount"), result.get("returnsAmount"))
                : String.format("Возвраты за %s..%s: %s, сумма: %s.",
                result.get("from"), result.get("to"), result.get("returnsCount"), result.get("returnsAmount"));
    }

    private String formatRedistributionFallback(Map<String, Object> result, String language) {
        Object raw = result.get("suggestions");
        if (!(raw instanceof List<?> suggestions) || suggestions.isEmpty()) {
            return "en".equals(language)
                    ? String.format("No critical transfer suggestions for %s..%s.", result.get("from"), result.get("to"))
                    : String.format("За %s..%s критичных рекомендаций по перемещению нет.", result.get("from"), result.get("to"));
        }
        String top = suggestions.stream().limit(TOP_CHAT_ITEMS).map(this::formatRedistributionItem).collect(Collectors.joining("; "));
        return "en".equals(language)
                ? String.format("Transfer suggestions for %s..%s: %s.", result.get("from"), result.get("to"), top)
                : String.format("Рекомендации по складу за %s..%s: %s.", result.get("from"), result.get("to"), top);
    }

    private String formatStoreInsightFallback(Map<String, Object> result, String language) {
        Object storesRaw = result.get("stores");
        if (!(storesRaw instanceof List<?> stores) || stores.isEmpty()) {
            return "en".equals(language)
                    ? String.format("No store analytics data for %s..%s.", result.get("from"), result.get("to"))
                    : String.format("За %s..%s нет данных по магазинам.", result.get("from"), result.get("to"));
        }
        String topStores = stores.stream().limit(3).map(this::formatStoreLine).collect(Collectors.joining("; "));
        return "en".equals(language)
                ? String.format("Store summary for %s..%s: %s.", result.get("from"), result.get("to"), topStores)
                : String.format("Сводка по магазинам за %s..%s: %s.", result.get("from"), result.get("to"), topStores);
    }

    private String formatBusinessHealthFallback(Map<String, Object> result, String language) {
        Object actionsRaw = result.get("recommendedActions");
        String actions;
        if (actionsRaw instanceof List<?> list && !list.isEmpty()) {
            actions = list.stream().limit(3).map(String::valueOf).collect(Collectors.joining("\n• "));
            actions = "• " + actions;
        } else {
            actions = "en".equals(language)
                    ? "• Focus on top products\n• Control returns\n• Balance stock between stores"
                    : "• Сфокусируйтесь на топ-товарах\n• Контролируйте возвраты\n• Балансируйте остатки между магазинами";
        }
        if ("en".equals(language)) {
            return String.format("Business health: revenue %s (prev %s), delta %s, returns %s (amount %s).\nRecommendations:\n%s",
                    safeText(result.get("currentRevenue")), safeText(result.get("previousRevenue")),
                    safeText(result.get("revenueDelta")), safeText(result.get("returnsCount")),
                    safeText(result.get("returnsAmount")), actions);
        }
        return String.format("Здоровье бизнеса: выручка %s (было %s), изменение %s, возвраты %s (сумма %s).\nРекомендации:\n%s",
                safeText(result.get("currentRevenue")), safeText(result.get("previousRevenue")),
                safeText(result.get("revenueDelta")), safeText(result.get("returnsCount")),
                safeText(result.get("returnsAmount")), actions);
    }

    private String formatTopItem(Object item) {
        if (item == null) return "—";
        if (item instanceof TopProductRow row) {
            return row.productName() + " (" + row.quantitySold() + " pcs)";
        }
        if (item instanceof Map<?, ?> map) {
            return safeText(map.get("productName")) + " (" + safeText(map.get("quantitySold")) + " pcs)";
        }
        String text = item.toString();
        return text.length() > 140 ? text.substring(0, 140) + "..." : text;
    }

    private String formatRedistributionItem(Object rawItem) {
        if (!(rawItem instanceof Map<?, ?> item)) return "transfer suggestion available";
        return String.format("%s: %s → %s (%s pcs)",
                safeText(item.get("productName")), safeText(item.get("fromStoreName")),
                safeText(item.get("toStoreName")), safeText(item.get("suggestedQty")));
    }

    private String formatStoreLine(Object storeRaw) {
        if (!(storeRaw instanceof Map<?, ?> store)) return "store data unavailable";
        return String.format("%s — revenue %s, checks %s, stock %s pcs",
                safeText(store.get("storeName")), safeText(store.get("revenue")),
                safeText(store.get("checks")), safeText(store.get("stockQty")));
    }

    private String extractTopProductsSummary(List<?> items) {
        if (items.isEmpty()) return "none";
        List<String> topNames = items.stream()
                .limit(3)
                .map(item -> {
                    if (item instanceof Map<?, ?> map) {
                        Object name = map.get("productName");
                        Object revenue = map.get("revenue");
                        return name + (revenue != null ? " (" + revenue + ")" : "");
                    }
                    return item.toString();
                })
                .collect(Collectors.toList());
        return String.join(", ", topNames);
    }

    private String extractTopProductName(List<?> items) {
        if (items.isEmpty()) return "unknown";
        Object first = items.get(0);
        if (first instanceof Map<?, ?> map) {
            Object name = map.get("productName");
            return name != null ? name.toString() : "unknown";
        }
        return first.toString();
    }

    private String extractStoresWithIssues(List<?> chart) {
        List<String> issues = new ArrayList<>();
        for (Object point : chart) {
            if (point instanceof Map<?, ?> map) {
                Object revenue = map.get("revenue");
                Object stockQty = map.get("stockQty");
                Object name = map.get("name");
                if (revenue instanceof Number && stockQty instanceof Number) {
                    double revenueVal = ((Number) revenue).doubleValue();
                    long stockVal = ((Number) stockQty).longValue();
                    if (revenueVal > 0 && stockVal < 50) {
                        issues.add(name + " (low stock: " + stockVal + ", revenue: " + revenueVal + ")");
                    }
                }
            }
        }
        return issues.isEmpty() ? "none" : String.join("; ", issues);
    }

    private String extractWorstStore(List<?> stores) {
        if (stores.isEmpty()) return "unknown";
        return stores.stream()
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .min((a, b) -> Double.compare(extractRevenue(a), extractRevenue(b)))
                .map(map -> map.get("storeName") + " (revenue: " + map.get("revenue") + ")")
                .orElse("unknown");
    }

    private String extractBestStore(List<?> stores) {
        if (stores.isEmpty()) return "unknown";
        return stores.stream()
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .max((a, b) -> Double.compare(extractRevenue(a), extractRevenue(b)))
                .map(map -> map.get("storeName") + " (revenue: " + map.get("revenue") + ")")
                .orElse("unknown");
    }

    private double extractRevenue(Map<?, ?> store) {
        Object raw = store.get("revenue");
        if (raw instanceof Number n) return n.doubleValue();
        return 0.0d;
    }

    private String safeText(Object value) {
        return value == null ? "—" : String.valueOf(value);
    }
}
