package com.pos.service.ai.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.service.ai.AnalyticsToolFacade;
import com.pos.service.ai.DeepSeekClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiAssistantGeneralChatService {
    private final AnalyticsToolFacade toolFacade;
    private final DeepSeekClient deepSeekClient;
    private final ObjectMapper objectMapper;

    public String answer(String question, String language, Integer companyId) {
        Map<String, Object> context = buildSafeContext(companyId);
        String ctx;
        try {
            ctx = objectMapper.writeValueAsString(context);
        } catch (Exception e) {
            ctx = context.toString();
        }

        String system = """
            You are a business assistant for a POS director.
            Reply in the same language as QUESTION.
            If USER_LANGUAGE is provided and differs from QUESTION, prefer USER_LANGUAGE.
            Style: concise, practical, conversational.
            Security first:
            - Use CONTEXT as the only source for business metrics/facts.
            - Never claim hidden/internal data access beyond CONTEXT.
            For non-analytic questions, answer naturally as a normal AI assistant.
            For business situation opinions, combine CONTEXT with 2-3 concrete actions.
            If context is insufficient, say what data is missing.
            Do not invent data.
            Do not render charts/tables/ascii diagrams in chat text.
            """;

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", system));
        messages.add(Map.of("role", "user", "content", "USER_LANGUAGE: " + language));
        messages.add(Map.of("role", "user", "content", "CONTEXT: " + ctx));
        messages.add(Map.of("role", "user", "content", "QUESTION: " + question));
        try {
            String answer = deepSeekClient.chat(messages);
            return (answer == null || answer.isBlank()) ? fallback(context, language, question) : answer.trim();
        } catch (Exception ignored) {
            return fallback(context, language, question);
        }
    }

    private Map<String, Object> buildSafeContext(Integer companyId) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(30);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("period", Map.of("from", from.toString(), "to", to.toString()));
        out.put("executiveOverview", toolFacade.executiveSystemOverview(from, to, companyId));
        out.put("todayRevenue", toolFacade.todayRevenue(companyId));
        out.put("businessHealth", toolFacade.businessHealthCheck(from, to, companyId));
        out.put("storeInsight", toolFacade.storeSalesAndStockInsight(from, to, companyId));
        out.put("topProducts", toolFacade.topProductsPeriod(from, to, 5));
        out.put("returnsSummary", toolFacade.returnsSummaryPeriod(from, to, companyId));
        out.put("stockRedistribution", toolFacade.stockRedistributionSuggestion(from, to, companyId));
        return out;
    }

    private String fallback(Map<String, Object> context, String language, String question) {
        String q = question == null ? "" : question.toLowerCase(Locale.ROOT).trim();
        if (isGreeting(q)) {
            return greetingReply(language);
        }
        if (isClarification(q)) {
            return buildClarifiedSnapshot(context, language);
        }
        String snapshot = buildSnapshot(context, language);
        if ("en".equals(language)) {
            return "Here is the current business picture based on available analytics.\n\n" + snapshot;
        }
        if ("uz".equals(language)) {
            return "Mavjud analitika asosida joriy biznes holati quyidagicha.\n\n" + snapshot;
        }
        return "Вот текущая картина по бизнесу на основе доступной аналитики.\n\n" + snapshot;
    }

    private boolean isGreeting(String q) {
        return q.equals("привет") || q.equals("здравствуйте") || q.equals("салам")
                || q.equals("hello") || q.equals("hi") || q.equals("assalomu alaykum")
                || q.equals("salom");
    }

    private boolean isClarification(String q) {
        return q.contains("что именно") || q.contains("не понял") || q.contains("то есть")
                || q.contains("раскажи") || q.contains("ситуац") || q.contains("проведи анализ")
                || q.contains("explain") || q.contains("details") || q.contains("clarify")
                || q.contains("aniqroq") || q.contains("tushuntir");
    }

    private String greetingReply(String language) {
        if ("en".equals(language)) {
            return "Hi! I can explain current business state in plain words and suggest next actions. Ask: \"What is wrong right now and what to do first?\"";
        }
        if ("uz".equals(language)) {
            return "Salom! Hozirgi biznes holatini sodda tilda tushuntirib, amaliy qadamlar beraman. So'rang: \"Hozir asosiy muammo nima va birinchi nima qilaylik?\"";
        }
        return "Привет! Могу простыми словами объяснить текущую ситуацию и дать конкретные шаги. Спросите: «Какая сейчас главная проблема и что делать первым?»";
    }

    private String buildClarifiedSnapshot(Map<String, Object> context, String language) {
        Object healthRaw = context.get("businessHealth");
        if (!(healthRaw instanceof Map<?, ?> health)) {
            return buildSnapshot(context, language);
        }

        String revenue = safeText(health.get("currentRevenue"));
        String delta = safeText(health.get("revenueDelta"));
        String returnsCount = safeText(health.get("returnsCount"));
        String lowStockCount = safeText(health.get("lowStockCount"));
        String actions = formatActions(health.get("recommendedActions"), language);

        if ("en".equals(language)) {
            return String.format("""
                    In simple terms:
                    - Revenue is now %s (change: %s).
                    - Returns count: %s.
                    - Low-stock products: %s.

                    What to do now:
                    %s
                    """, revenue, delta, returnsCount, lowStockCount, actions);
        }
        if ("uz".equals(language)) {
            return String.format("""
                    Sodda qilib:
                    - Hozirgi tushum: %s (o'zgarish: %s).
                    - Qaytishlar soni: %s.
                    - Kam qoldiqdagi mahsulotlar: %s.

                    Hozirgi amaliy qadamlar:
                    %s
                    """, revenue, delta, returnsCount, lowStockCount, actions);
        }
        return String.format("""
                Простыми словами:
                - Сейчас выручка: %s (изменение: %s).
                - Количество возвратов: %s.
                - Товаров с низким остатком: %s.

                Что делать сейчас:
                %s
                """, revenue, delta, returnsCount, lowStockCount, actions);
    }

    private String buildSnapshot(Map<String, Object> context, String language) {
        Object executiveOverviewRaw = context.get("executiveOverview");
        if (executiveOverviewRaw instanceof Map<?, ?> executiveOverview) {
            return buildExecutiveSnapshot(executiveOverview, language);
        }
        Object healthRaw = context.get("businessHealth");
        if (!(healthRaw instanceof Map<?, ?> health)) {
            return "en".equals(language)
                    ? "No analytics snapshot is available right now."
                    : ("uz".equals(language)
                    ? "Hozircha analitik holatni olish imkoni bo'lmadi."
                    : "Сейчас не удалось получить аналитический срез.");
        }

        String revenue = safeText(health.get("currentRevenue"));
        String previousRevenue = safeText(health.get("previousRevenue"));
        String delta = safeText(health.get("revenueDelta"));
        String returnsCount = safeText(health.get("returnsCount"));
        String returnsAmount = safeText(health.get("returnsAmount"));
        String actions = formatActions(health.get("recommendedActions"), language);
        String storesSummary = summarizeStores(context.get("storeInsight"), language);
        String topProductsSummary = summarizeTopProducts(context.get("topProducts"), language);

        if ("en".equals(language)) {
            return String.format("""
                    Current state:
                    - Revenue: %s (previous: %s, delta: %s)
                    - Returns: %s (amount: %s)
                    - Stores: %s
                    - Top products: %s

                    Recommended actions:
                    %s
                    """, revenue, previousRevenue, delta, returnsCount, returnsAmount, storesSummary, topProductsSummary, actions);
        }
        if ("uz".equals(language)) {
            return String.format("""
                    Joriy holat:
                    - Tushum: %s (oldingi: %s, farq: %s)
                    - Qaytishlar: %s (summa: %s)
                    - Do'konlar: %s
                    - Top mahsulotlar: %s

                    Tavsiya etilgan amallar:
                    %s
                    """, revenue, previousRevenue, delta, returnsCount, returnsAmount, storesSummary, topProductsSummary, actions);
        }
        return String.format("""
                Текущее состояние:
                - Выручка: %s (было: %s, изменение: %s)
                - Возвраты: %s (сумма: %s)
                - По магазинам: %s
                - Топ-товары: %s

                Рекомендуемые действия:
                %s
                """, revenue, previousRevenue, delta, returnsCount, returnsAmount, storesSummary, topProductsSummary, actions);
    }

    private String buildExecutiveSnapshot(Map<?, ?> executiveOverview, String language) {
        Map<?, ?> sales = executiveOverview.get("sales") instanceof Map<?, ?> m ? m : Map.of();
        Map<?, ?> catalog = executiveOverview.get("catalog") instanceof Map<?, ?> m ? m : Map.of();
        Map<?, ?> stores = executiveOverview.get("stores") instanceof Map<?, ?> m ? m : Map.of();
        Map<?, ?> zReports = executiveOverview.get("zReports") instanceof Map<?, ?> m ? m : Map.of();
        String topStores = summarizeTopStoreRows(stores.get("top"), language);
        String topProducts = summarizeTopProducts(executiveOverview.get("topProducts"), language);

        if ("en".equals(language)) {
            return String.format("""
                    Executive system overview:
                    - Revenue: %s, transactions: %s, average check: %s
                    - Stores: %s active of %s total (with sales: %s)
                    - Catalog: %s products, %s categories, low stock: %s
                    - Z-reports: %s (total amount: %s)
                    - Top stores: %s
                    - Top products: %s
                    """,
                    safeText(sales.get("revenue")), safeText(sales.get("transactions")), safeText(sales.get("averageCheck")),
                    safeText(stores.get("active")), safeText(stores.get("total")), safeText(stores.get("withSales")),
                    safeText(catalog.get("products")), safeText(catalog.get("categories")), safeText(catalog.get("lowStockProducts")),
                    safeText(zReports.get("count")), safeText(zReports.get("totalAmount")),
                    topStores, topProducts
            );
        }
        if ("uz".equals(language)) {
            return String.format("""
                    Tizim bo'yicha umumiy holat:
                    - Tushum: %s, tranzaksiya: %s, o'rtacha чек: %s
                    - Do'konlar: %s faol / %s jami (savdoli: %s)
                    - Katalog: %s mahsulot, %s kategoriya, kam qoldiq: %s
                    - Z-hisobotlar: %s (jami summa: %s)
                    - Top do'konlar: %s
                    - Top mahsulotlar: %s
                    """,
                    safeText(sales.get("revenue")), safeText(sales.get("transactions")), safeText(sales.get("averageCheck")),
                    safeText(stores.get("active")), safeText(stores.get("total")), safeText(stores.get("withSales")),
                    safeText(catalog.get("products")), safeText(catalog.get("categories")), safeText(catalog.get("lowStockProducts")),
                    safeText(zReports.get("count")), safeText(zReports.get("totalAmount")),
                    topStores, topProducts
            );
        }
        return String.format("""
                Общая картина по системе:
                - Выручка: %s, транзакций: %s, средний чек: %s
                - Магазины: активных %s из %s (с продажами: %s)
                - Каталог: товаров %s, категорий %s, низкий остаток: %s
                - Z-отчёты: %s (общая сумма: %s)
                - Топ магазинов: %s
                - Топ товаров: %s
                """,
                safeText(sales.get("revenue")), safeText(sales.get("transactions")), safeText(sales.get("averageCheck")),
                safeText(stores.get("active")), safeText(stores.get("total")), safeText(stores.get("withSales")),
                safeText(catalog.get("products")), safeText(catalog.get("categories")), safeText(catalog.get("lowStockProducts")),
                safeText(zReports.get("count")), safeText(zReports.get("totalAmount")),
                topStores, topProducts
        );
    }

    private String formatActions(Object rawActions, String language) {
        if (rawActions instanceof List<?> list && !list.isEmpty()) {
            return list.stream()
                    .limit(3)
                    .map(String::valueOf)
                    .map(s -> localizeAction(s, language))
                    .map(s -> "- " + s)
                    .collect(Collectors.joining("\n"));
        }
        if ("en".equals(language)) {
            return "- Track top products daily\n- Review return reasons weekly\n- Rebalance stock between stores";
        }
        if ("uz".equals(language)) {
            return "- Har kuni top mahsulotlarni kuzating\n- Har hafta qaytarish sabablarini tekshiring\n- Ombor qoldiqlarini do'konlar orasida balanslang";
        }
        return "- Ежедневно контролируйте топ-товары\n- Еженедельно проверяйте причины возвратов\n- Балансируйте остатки между магазинами";
    }

    private String safeText(Object value) {
        return value == null ? "—" : String.valueOf(value);
    }

    private String summarizeStores(Object storeInsightRaw, String language) {
        if (!(storeInsightRaw instanceof Map<?, ?> storeInsight)) {
            return "en".equals(language) ? "no store data" : ("uz".equals(language) ? "do'kon ma'lumoti yo'q" : "нет данных");
        }
        Object storesRaw = storeInsight.get("stores");
        if (!(storesRaw instanceof List<?> stores) || stores.isEmpty()) {
            return "en".equals(language) ? "no store data" : ("uz".equals(language) ? "do'kon ma'lumoti yo'q" : "нет данных");
        }
        return stores.stream()
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .limit(2)
                .map(s -> safeText(s.get("storeName")) + " (rev " + safeText(s.get("revenue")) + ")")
                .collect(Collectors.joining("; "));
    }

    private String summarizeTopProducts(Object topProductsRaw, String language) {
        if (!(topProductsRaw instanceof Map<?, ?> topProducts)) {
            return "en".equals(language) ? "n/a" : ("uz".equals(language) ? "yo'q" : "н/д");
        }
        Object itemsRaw = topProducts.get("items");
        if (!(itemsRaw instanceof List<?> items) || items.isEmpty()) {
            return "en".equals(language) ? "n/a" : ("uz".equals(language) ? "yo'q" : "н/д");
        }
        return items.stream().limit(3).map(this::formatProductName).collect(Collectors.joining(", "));
    }

    private String summarizeTopStoreRows(Object topStoresRaw, String language) {
        if (!(topStoresRaw instanceof List<?> stores) || stores.isEmpty()) {
            return "en".equals(language) ? "n/a" : ("uz".equals(language) ? "yo'q" : "н/д");
        }
        return stores.stream()
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .limit(3)
                .map(s -> safeText(s.get("storeName")) + " (" + safeText(s.get("revenue")) + ")")
                .collect(Collectors.joining(", "));
    }

    private String formatProductName(Object item) {
        if (item instanceof Map<?, ?> map) {
            return safeText(map.get("productName"));
        }
        String text = String.valueOf(item);
        int idx = text.indexOf("productName=");
        if (idx >= 0) {
            int start = idx + "productName=".length();
            int end = text.indexOf(",", start);
            if (end > start) return text.substring(start, end).trim();
        }
        return text;
    }

    private String localizeAction(String action, String language) {
        if ("uz".equals(language)) {
            if (action.startsWith("Revenue growing")) return "Tushum o'smoqda. Eng kuchli mahsulotlarga fokus qiling.";
            if (action.startsWith("Sales declined")) return "Savdo pasaygan. Past ko'rsatkichli mahsulotni tekshiring.";
            if (action.startsWith("Returns detected")) return "Qaytishlar bor. Qaytarish sabablarini tekshiring.";
        } else if (!"en".equals(language)) {
            if (action.startsWith("Revenue growing")) return "Выручка растет. Сфокусируйтесь на сильных товарах.";
            if (action.startsWith("Sales declined")) return "Продажи снизились. Проверьте проседающий товар.";
            if (action.startsWith("Returns detected")) return "Есть возвраты. Разберите причины возвратов.";
        }
        return action;
    }
}

