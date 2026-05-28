package com.pos.service.ai.impl;

import java.util.Locale;

final class AiAssistantLlmPolicy {

    private AiAssistantLlmPolicy() {
    }

    static boolean wantsDetailedAnswer(String question) {
        if (question == null || question.isBlank()) {
            return false;
        }
        String q = question.toLowerCase(Locale.ROOT);
        return q.contains("совет") || q.contains("рекоменд") || q.contains("что делать")
                || q.contains("почему") || q.contains("подробн") || q.contains("объясн")
                || q.contains("разбор") || q.contains("проанализ")
                || q.contains("advice") || q.contains("recommend") || q.contains("analyze")
                || q.contains("explain") || q.contains("tahlil") || q.contains("maslahat");
    }

    static boolean useLlmForInsight(String question, String tool) {
        if (wantsDetailedAnswer(question)) {
            return true;
        }
        return AiAssistantToolCatalog.BUSINESS_HEALTH.equals(tool)
                || AiAssistantToolCatalog.REDISTRIBUTION.equals(tool);
    }

    static boolean useLlmForGeneralChat(String question) {
        return wantsDetailedAnswer(question);
    }
}
