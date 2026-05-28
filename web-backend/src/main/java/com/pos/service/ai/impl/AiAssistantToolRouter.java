package com.pos.service.ai.impl;

import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
class AiAssistantToolRouter {

    AiAssistantToolCall selectTool(String message) {
        return selectToolFallback(AiAssistantMessageNormalizer.forRouting(message));
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
        String q = AiAssistantMessageNormalizer.forRouting(message);
        if (q.length() > 80) {
            return false;
        }
        return q.equals("привет") || q.equals("здравствуйте") || q.equals("салам") || q.equals("салам алейкум")
                || q.equals("hello") || q.equals("hi") || q.equals("how are you") || q.equals("hey")
                || q.equals("как дела") || q.equals("спасибо") || q.equals("благодарю") || q.equals("пока")
                || q.equals("rahmat") || q.equals("thanks") || q.equals("thank you")
                || q.startsWith("привет ") || q.startsWith("hello ");
    }

    private AiAssistantToolCall selectToolFallback(String q) {
        if (q.contains("инвентар") || q.contains("inventory count") || q.contains("inventory")) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.INVENTORY, null, null, 10);
        }
        if (q.contains("возврат") || q.contains("return")) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.RETURNS_SUMMARY, null, null, 10);
        }
        if (q.contains("топ") || q.contains("top") || q.contains("лидер")
                || (q.contains("товар") && !q.contains("остат") && !q.contains("склад"))) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.TOP_PRODUCTS, null, null, 10);
        }
        if (q.contains("сегодня") || q.contains("today") || q.contains("за день")) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.TODAY_REVENUE, null, null, 10);
        }
        if (q.contains("продаж") || q.contains("выруч") || q.contains("чек") || q.contains("sales") || q.contains("revenue")) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.SALES_PERIOD, null, null, 10);
        }
        if (q.contains("graph") || q.contains("chart") || q.contains("график")
                || q.contains("по магазин") || q.contains("магазин") || q.contains("store") || q.contains("филиал")) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.STORE_INSIGHT, null, null, 10);
        }
        if (q.contains("перемещ") || q.contains("распредел")) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.REDISTRIBUTION, null, null, 10);
        }
        if (q.contains("склад") || q.contains("остат") || q.contains("stock")) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.INVENTORY, null, null, 10);
        }
        if (isConversationalOverview(q)) {
            return new AiAssistantToolCall(AiAssistantToolCatalog.SMALLTALK, null, null, 10);
        }
        return new AiAssistantToolCall(AiAssistantToolCatalog.SMALLTALK, null, null, 10);
    }

    private boolean isConversationalOverview(String q) {
        return q.contains("текущее состояние") || q.contains("общее состояние") || q.contains("состояние системы")
                || q.contains("по всей системе") || q.contains("как дела у бизнеса") || q.contains("общая картина")
                || q.contains("по системе всё") || q.contains("скажи всё") || q.contains("что у нас по бизнес")
                || q.contains("как бизнес") || q.contains("что не так") || q.contains("что делать")
                || q.contains("совет") || q.contains("рекоменд");
    }
}
