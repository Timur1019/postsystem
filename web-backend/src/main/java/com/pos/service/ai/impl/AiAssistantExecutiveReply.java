package com.pos.service.ai.impl;

import java.util.Map;

final class AiAssistantExecutiveReply {

    private AiAssistantExecutiveReply() {
    }

    static String format(Map<String, Object> executive, String language) {
        String brief = AiAssistantContextBrief.build(Map.of("executiveOverview", executive), language);
        if ("en".equals(language)) {
            return """
                    Here is the current picture from your POS data:

                    %s

                    Priority: review stores with weak sales or high returns first, then low-stock items from the catalog line above.
                    """.formatted(brief).trim();
        }
        if ("uz".equals(language)) {
            return """
                    POS tizimidagi joriy holat:

                    %s

                    Birinchi navbatda: past savdo yoki ko'p qaytarish bo'lgan do'konlar va kam qoldiqli mahsulotlarni tekshiring.
                    """.formatted(brief).trim();
        }
        return """
                Краткая сводка по данным системы:

                %s

                В первую очередь: проверьте магазины с просадкой продаж или ростом возвратов и товары с низким остатком из строки каталога выше.
                """.formatted(brief).trim();
    }
}
