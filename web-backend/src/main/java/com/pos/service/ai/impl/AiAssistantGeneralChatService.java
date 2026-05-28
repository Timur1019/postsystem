package com.pos.service.ai.impl;

import com.pos.config.AiAssistantProperties;
import com.pos.exception.BadRequestException;
import com.pos.service.ai.DeepSeekClient;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiAssistantGeneralChatService {

    private final DeepSeekClient deepSeekClient;
    private final AiAssistantProperties properties;
    private final AiAssistantAnalyticsCache analyticsCache;

    public String answer(String question, String language, Integer companyId) {
        if (!properties.isLlmReady()) {
            if (AiAssistantOfflineReply.isSimpleGreeting(question)) {
                return AiAssistantOfflineReply.greetingWithoutLlm(language);
            }
            return AiAssistantOfflineReply.notConfigured(language);
        }

        if (AiAssistantOfflineReply.isSimpleGreeting(question)) {
            return answerGreeting(question, language);
        }

        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(30);
        Map<String, Object> context = Map.of(
                "executiveOverview", analyticsCache.executiveOverview(from, to, companyId)
        );
        String dataBrief = AiAssistantContextBrief.build(context, language);

        String system = """
            You are a business co-pilot for a retail/POS director.
            Reply in the same language as the user's question (Russian, Uzbek, or English).

            Personality:
            - Talk naturally, like a smart colleague in chat — not a rigid report template.
            - Be clear, practical, and specific.

            Data rules (critical):
            - Use only numbers, store names, and product names from DATA below.
            - Never invent metrics, dates, stores, or products.
            - If the user asks for data you do not have, say exactly what is missing.

            When the question is about business:
            - Explain the situation in plain language.
            - Give 2-4 concrete recommendations tied to DATA.
            - Optionally suggest one follow-up question.

            Do not draw ASCII charts or tables in the chat (charts are shown separately in UI).
            Keep answers focused.
            """;

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", system));
        messages.add(Map.of("role", "user", "content", "DATA (system analytics, last ~30 days):\n" + dataBrief));
        messages.add(Map.of("role", "user", "content", "QUESTION: " + question));

        try {
            String answer = deepSeekClient.chat(messages);
            if (answer != null && !answer.isBlank()) {
                return answer.trim();
            }
        } catch (BadRequestException e) {
            LogUtil.warn(AiAssistantGeneralChatService.class, "LLM chat failed: {}", e.getMessage());
            return AiAssistantOfflineReply.llmFailed(language, dataBrief, e.getMessage());
        } catch (Exception e) {
            LogUtil.warn(AiAssistantGeneralChatService.class, "LLM chat failed: {}", e.getMessage());
            return AiAssistantOfflineReply.llmFailed(language, dataBrief, null);
        }
        return AiAssistantOfflineReply.llmFailed(language, dataBrief, null);
    }

    private String answerGreeting(String question, String language) {
        String langHint = switch (language) {
            case "en" -> "English";
            case "uz" -> "Uzbek";
            default -> "Russian";
        };
        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", """
                        You are a friendly POS business assistant for a retail director.
                        Reply in %s, in 2-3 short sentences.
                        Greet the user and offer help with sales, stores, stock, and analytics from the system.
                        Do not invent any numbers.
                        """.formatted(langHint)),
                Map.of("role", "user", "content", question)
        );
        try {
            String answer = deepSeekClient.chat(messages);
            if (answer != null && !answer.isBlank()) {
                return answer.trim();
            }
        } catch (Exception e) {
            LogUtil.warn(AiAssistantGeneralChatService.class, "Greeting LLM failed: {}", e.getMessage());
        }
        return AiAssistantOfflineReply.greetingWithoutLlm(language);
    }
}
