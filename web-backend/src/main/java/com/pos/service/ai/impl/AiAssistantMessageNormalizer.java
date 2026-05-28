package com.pos.service.ai.impl;

import java.util.Locale;

final class AiAssistantMessageNormalizer {

    private AiAssistantMessageNormalizer() {
    }

    static String forRouting(String message) {
        if (message == null) {
            return "";
        }
        return message.trim()
                .replaceAll("[.!?…,;:]+$", "")
                .trim()
                .toLowerCase(Locale.ROOT);
    }
}
