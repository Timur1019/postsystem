package com.pos.service.ai.impl;

import com.pos.config.AiAssistantProperties;
import com.pos.dto.ai.AiAssistantChatMessage;
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

    public String answer(String question, String language, Integer companyId, List<AiAssistantChatMessage> history) {
        if (!properties.isLlmReady()) {
            if (AiAssistantOfflineReply.isSimpleGreeting(question)) {
                return AiAssistantOfflineReply.greetingWithoutLlm(language);
            }
            return AiAssistantOfflineReply.notConfigured(language);
        }

        if (AiAssistantOfflineReply.isSimpleGreeting(question) && (history == null || history.isEmpty())) {
            return answerGreeting(question, language);
        }

        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(30);
        Map<String, Object> context = Map.of(
                "executiveOverview", analyticsCache.executiveOverview(from, to, companyId)
        );
        String dataBrief = AiAssistantContextBrief.build(context, language);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", AiAssistantPrompts.generalChatSystem()));
        messages.add(Map.of("role", "user", "content", "DATA (system analytics, last ~30 days):\n" + dataBrief));
        AiAssistantConversationHistory.appendToLlmMessages(messages, history);
        messages.add(Map.of("role", "user", "content", question));

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
