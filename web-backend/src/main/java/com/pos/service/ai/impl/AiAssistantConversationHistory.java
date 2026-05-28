package com.pos.service.ai.impl;

import com.pos.dto.ai.AiAssistantChatMessage;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

final class AiAssistantConversationHistory {

    private static final int MAX_TURNS = 10;
    /** Sent to LLM; full text may be stored in chat UI. */
    private static final int MAX_CONTENT_CHARS = 2500;

    private AiAssistantConversationHistory() {
    }

    static List<AiAssistantChatMessage> sanitize(List<AiAssistantChatMessage> history) {
        if (history == null || history.isEmpty()) {
            return List.of();
        }
        List<AiAssistantChatMessage> out = new ArrayList<>();
        for (AiAssistantChatMessage item : history) {
            if (item == null || item.content() == null || item.content().isBlank()) {
                continue;
            }
            String role = item.role() != null ? item.role().trim().toLowerCase(Locale.ROOT) : "";
            if (!"user".equals(role) && !"assistant".equals(role)) {
                continue;
            }
            String content = truncate(item.content().trim(), MAX_CONTENT_CHARS);
            out.add(new AiAssistantChatMessage(role, content));
        }
        if (out.size() <= MAX_TURNS * 2) {
            return List.copyOf(out);
        }
        return List.copyOf(out.subList(out.size() - MAX_TURNS * 2, out.size()));
    }

    static void appendToLlmMessages(List<Map<String, String>> target, List<AiAssistantChatMessage> history) {
        for (AiAssistantChatMessage item : sanitize(history)) {
            target.add(Map.of("role", item.role(), "content", item.content()));
        }
    }

    static String contextHint(List<AiAssistantChatMessage> history) {
        List<AiAssistantChatMessage> safe = sanitize(history);
        if (safe.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        int from = Math.max(0, safe.size() - 4);
        for (int i = from; i < safe.size(); i++) {
            AiAssistantChatMessage m = safe.get(i);
            sb.append(m.role()).append(": ").append(truncate(m.content(), 200));
            if (i < safe.size() - 1) {
                sb.append(" | ");
            }
        }
        return sb.toString();
    }

    private static String truncate(String value, int max) {
        if (value.length() <= max) {
            return value;
        }
        return value.substring(0, max) + "…";
    }
}
