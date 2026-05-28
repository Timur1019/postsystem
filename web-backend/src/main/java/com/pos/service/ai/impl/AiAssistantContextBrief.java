package com.pos.service.ai.impl;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

final class AiAssistantContextBrief {

    private AiAssistantContextBrief() {
    }

    static String build(Map<String, Object> context, String language) {
        Object executiveRaw = context.get("executiveOverview");
        if (executiveRaw instanceof Map<?, ?> executive) {
            return fromExecutive(executive, language);
        }
        return fromLegacy(context, language);
    }

    private static String fromExecutive(Map<?, ?> executive, String language) {
        Map<?, ?> sales = asMap(executive.get("sales"));
        Map<?, ?> catalog = asMap(executive.get("catalog"));
        Map<?, ?> stores = asMap(executive.get("stores"));
        Map<?, ?> zReports = asMap(executive.get("zReports"));
        Map<?, ?> returns = asMap(executive.get("returns"));

        String periodFrom = text(executive.get("from"));
        String periodTo = text(executive.get("to"));
        String topStores = formatStoreRows(stores.get("top"), 10);
        String topProducts = formatTopProducts(executive.get("topProducts"), 10);

        if ("en".equals(language)) {
            return """
                    Period: %s .. %s
                    Sales: revenue %s, transactions %s, average check %s
                    Stores: %s active of %s total, with sales in period: %s
                    Catalog: %s products, %s categories, low stock items: %s
                    Returns: %s, amount %s
                    Z-reports: %s reports, total amount %s
                    Top stores: %s
                    Top products: %s
                    """.formatted(
                    periodFrom, periodTo,
                    text(sales.get("revenue")), text(sales.get("transactions")), text(sales.get("averageCheck")),
                    text(stores.get("active")), text(stores.get("total")), text(stores.get("withSales")),
                    text(catalog.get("products")), text(catalog.get("categories")), text(catalog.get("lowStockProducts")),
                    text(returns.get("count")), text(returns.get("amount")),
                    text(zReports.get("count")), text(zReports.get("totalAmount")),
                    topStores, topProducts
            ).trim();
        }
        if ("uz".equals(language)) {
            return """
                    Davr: %s .. %s
                    Savdo: tushum %s, tranzaksiya %s, o'rtacha chek %s
                    Do'konlar: %s faol / %s jami, davrda savdo: %s
                    Katalog: %s mahsulot, %s kategoriya, kam qoldiq: %s
                    Qaytarishlar: %s, summa %s
                    Z-hisobotlar: %s ta, jami summa %s
                    Top do'konlar: %s
                    Top mahsulotlar: %s
                    """.formatted(
                    periodFrom, periodTo,
                    text(sales.get("revenue")), text(sales.get("transactions")), text(sales.get("averageCheck")),
                    text(stores.get("active")), text(stores.get("total")), text(stores.get("withSales")),
                    text(catalog.get("products")), text(catalog.get("categories")), text(catalog.get("lowStockProducts")),
                    text(returns.get("count")), text(returns.get("amount")),
                    text(zReports.get("count")), text(zReports.get("totalAmount")),
                    topStores, topProducts
            ).trim();
        }
        return """
                Период: %s .. %s
                Продажи: выручка %s, чеков %s, средний чек %s
                Магазины: активных %s из %s, с продажами за период: %s
                Каталог: товаров %s, категорий %s, низкий остаток: %s
                Возвраты: %s, сумма %s
                Z-отчёты: %s шт., сумма %s
                Топ магазинов: %s
                Топ товаров: %s
                """.formatted(
                periodFrom, periodTo,
                text(sales.get("revenue")), text(sales.get("transactions")), text(sales.get("averageCheck")),
                text(stores.get("active")), text(stores.get("total")), text(stores.get("withSales")),
                text(catalog.get("products")), text(catalog.get("categories")), text(catalog.get("lowStockProducts")),
                text(returns.get("count")), text(returns.get("amount")),
                text(zReports.get("count")), text(zReports.get("totalAmount")),
                topStores, topProducts
        ).trim();
    }

    private static String fromLegacy(Map<String, Object> context, String language) {
        Object healthRaw = context.get("businessHealth");
        if (!(healthRaw instanceof Map<?, ?> health)) {
            return "en".equals(language) ? "Analytics context unavailable." : "Контекст аналитики недоступен.";
        }
        return """
                Revenue: %s (delta %s)
                Returns: %s
                Stores snapshot: %s
                Top products: %s
                """.formatted(
                text(health.get("currentRevenue")),
                text(health.get("revenueDelta")),
                text(health.get("returnsCount")),
                summarizeStores(context.get("storeInsight"), 10),
                summarizeTopProducts(context.get("topProducts"), 10)
        ).trim();
    }

    private static String formatStoreRows(Object raw, int limit) {
        if (!(raw instanceof List<?> list) || list.isEmpty()) {
            return "—";
        }
        return list.stream()
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .limit(limit)
                .map(s -> text(s.get("storeName")) + " — выручка " + text(s.get("revenue")))
                .collect(Collectors.joining("; "));
    }

    private static String formatTopProducts(Object raw, int limit) {
        if (!(raw instanceof List<?> list) || list.isEmpty()) {
            return "—";
        }
        return list.stream()
                .limit(limit)
                .map(AiAssistantContextBrief::formatProductName)
                .collect(Collectors.joining("; "));
    }

    private static String summarizeStores(Object storeInsightRaw, int limit) {
        if (!(storeInsightRaw instanceof Map<?, ?> insight)) {
            return "—";
        }
        Object storesRaw = insight.get("stores");
        if (!(storesRaw instanceof List<?> stores) || stores.isEmpty()) {
            return "—";
        }
        return stores.stream()
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .limit(limit)
                .map(s -> text(s.get("storeName")) + " — " + text(s.get("revenue")))
                .collect(Collectors.joining("; "));
    }

    private static String summarizeTopProducts(Object topProductsRaw, int limit) {
        if (!(topProductsRaw instanceof Map<?, ?> topProducts)) {
            return "—";
        }
        return formatTopProducts(topProducts.get("items"), limit);
    }

    private static String formatProductName(Object item) {
        if (item instanceof Map<?, ?> map) {
            Object name = map.get("productName");
            Object qty = map.get("quantitySold");
            if (qty != null) {
                return text(name) + " (" + qty + " шт.)";
            }
            return text(name);
        }
        String s = String.valueOf(item);
        int idx = s.indexOf("productName=");
        if (idx >= 0) {
            int start = idx + "productName=".length();
            int end = s.indexOf(',', start);
            if (end > start) {
                return s.substring(start, end).trim();
            }
        }
        return s;
    }

    private static Map<?, ?> asMap(Object raw) {
        return raw instanceof Map<?, ?> m ? m : Map.of();
    }

    private static String text(Object value) {
        return value == null ? "—" : String.valueOf(value);
    }
}
