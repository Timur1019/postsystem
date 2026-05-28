package com.pos.service.ai.impl;

import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
class AiAssistantToolRouter {

    AiAssistantToolCall selectTool(String message) {
        // Fast keyword router only — avoids an extra DeepSeek round-trip per request.
        return selectToolFallback(message);
    }

    String detectLanguage(String message) {
        String q = message.toLowerCase(Locale.ROOT);
        if (q.contains("answer in english") || q.contains("respond in english") || q.contains("на английском")) return "en";
        if (q.contains("узбек") || q.contains("o'zbek") || q.contains("uzbek")
                || q.contains("salom") || q.contains("rahmat") || q.contains("qanday")
                || q.contains("savdo") || q.contains("ombor") || q.contains("do'kon")
                || q.contains("bugun") || q.contains("tushum") || q.contains("qaytar")) return "uz";
        if (q.chars().anyMatch(ch -> ch >= 0x0400 && ch <= 0x04FF)) return "ru";
        return "en";
    }

    boolean isSmallTalk(String message) {
        String q = message.toLowerCase(Locale.ROOT).trim();
        if (q.length() > 80) {
            return false;
        }
        return q.equals("привет") || q.equals("здравствуйте") || q.equals("салам") || q.equals("салам алейкум")
                || q.equals("hello") || q.equals("hi") || q.equals("how are you") || q.equals("hey")
                || q.equals("как дела") || q.equals("спасибо") || q.equals("благодарю") || q.equals("пока")
                || q.equals("rahmat") || q.equals("thanks") || q.equals("thank you")
                || q.startsWith("привет ") || q.startsWith("hello ");
    }

    private AiAssistantToolCall selectToolFallback(String message) {
        String q = message.toLowerCase(Locale.ROOT);
        if (isConversationalOverview(q)) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.SMALLTALK, null, null, 10);
        }
        if (q.contains("graph") || q.contains("chart") || q.contains("график")) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.STORE_INSIGHT, null, null, 10);
        }
        if (q.contains("по магазинам") || q.contains("по магазин") || q.contains("первому магазин")
                || q.contains("второму магазин") || q.contains("1 магазин") || q.contains("2 магазин")
                || q.contains("магазин 1") || q.contains("магазин 2") || q.contains("store 1") || q.contains("store 2")) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.STORE_INSIGHT, null, null, 10);
        }
        if ((q.contains("магазин") || q.contains("store") || q.contains("филиал"))
                && (q.contains("продаж") || q.contains("sales") || q.contains("остат") || q.contains("stock"))) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.STORE_INSIGHT, null, null, 10);
        }
        if (q.contains("склад") || q.contains("stock") || q.contains("остат") || q.contains("перемещ") || q.contains("распредел")) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.REDISTRIBUTION, null, null, 10);
        }
        if (q.contains("возврат") || q.contains("return")) return new AiAssistantToolCall(AiAssistantToolCatalog.RETURNS_SUMMARY, null, null, 10);
        if (q.contains("топ") || q.contains("top") || q.contains("лидер") || q.contains("товар") || q.contains("product")) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.TOP_PRODUCTS, null, null, 5);
        }
        if (q.contains("выруч") || q.contains("revenue") || q.contains("чек") || q.contains("продаж") || q.contains("sales")) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.TODAY_REVENUE, null, null, 10);
        }
        return new AiAssistantToolCall(AiAssistantToolCatalog.SMALLTALK, null, null, 10);
    }

    private boolean isConversationalOverview(String q) {
        return q.contains("текущее состояние") || q.contains("общее состояние") || q.contains("состояние системы")
                || q.contains("по всей системе") || q.contains("как дела у бизнеса") || q.contains("общая картина")
                || q.contains("по системе") || q.contains("по системе всё") || q.contains("скажи всё")
                || q.contains("что у нас") || q.contains("как бизнес") || q.contains("как дела с бизнес")
                || q.contains("все отчет") || q.contains("категор") || q.contains("товары по системе")
                || q.contains("z-отчет") || q.contains("z отчет") || q.contains("совет") || q.contains("рекоменд")
                || q.contains("что не так") || q.contains("как исправ") || q.contains("улучш") || q.contains("что делать")
                || q.contains("почему пада") || q.contains("расскаж") || q.contains("объясн") || q.contains("помоги")
                || q.contains("current state") || q.contains("overall state") || q.contains("system state")
                || q.contains("health check") || q.contains("why ") || q.contains("improve") || q.contains("fix ")
                || q.contains("advice") || q.contains("recommend");
    }
}
