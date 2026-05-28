package com.pos.service.ai.impl;

import com.pos.config.AiAssistantProperties;
import com.pos.exception.BadRequestException;
import com.pos.service.ai.AnalyticsToolFacade;
import com.pos.service.ai.DeepSeekClient;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiAssistantGeneralChatService {

    private final AnalyticsToolFacade toolFacade;
    private final DeepSeekClient deepSeekClient;
    private final AiAssistantProperties properties;

    public String answer(String question, String language, Integer companyId) {
        if (!properties.isLlmReady()) {
            if (AiAssistantOfflineReply.isSimpleGreeting(question)) {
                return AiAssistantOfflineReply.greetingWithoutLlm(language);
            }
            return AiAssistantOfflineReply.notConfigured(language);
        }

        Map<String, Object> context = buildSafeContext(companyId);
        String dataBrief = AiAssistantContextBrief.build(context, language);

        String system = """
            You are a business co-pilot for a retail/POS director.
            Reply in the same language as the user's question (Russian, Uzbek, or English).

            Personality:
            - Talk naturally, like a smart colleague in chat — not a rigid report template.
            - Be clear, practical, and specific.
            - For greetings or small talk, reply briefly and warmly, then offer help with business analytics.

            Data rules (critical):
            - Use only numbers, store names, and product names from DATA below.
            - Never invent metrics, dates, stores, or products.
            - If the user asks for data you do not have, say exactly what is missing.
            - Do not claim access to hidden systems beyond DATA.

            When the question is about business:
            - Explain the situation in plain language.
            - Give 2-4 concrete recommendations tied to DATA.
            - Optionally suggest one follow-up question.

            Do not draw ASCII charts or tables in the chat (charts are shown separately in UI).
            Keep answers focused; avoid repeating the same block on every message.
            """;

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", system));
        messages.add(Map.of("role", "user", "content", "DATA (system analytics, last ~30 days unless stated):\n" + dataBrief));
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

    private Map<String, Object> buildSafeContext(Integer companyId) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(30);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("from", from.toString());
        out.put("to", to.toString());
        out.put("executiveOverview", toolFacade.executiveSystemOverview(from, to, companyId));
        out.put("todayRevenue", toolFacade.todayRevenue(companyId));
        out.put("businessHealth", toolFacade.businessHealthCheck(from, to, companyId));
        out.put("storeInsight", toolFacade.storeSalesAndStockInsight(from, to, companyId));
        out.put("topProducts", toolFacade.topProductsPeriod(from, to, 10));
        out.put("returnsSummary", toolFacade.returnsSummaryPeriod(from, to, companyId));
        return out;
    }
}
