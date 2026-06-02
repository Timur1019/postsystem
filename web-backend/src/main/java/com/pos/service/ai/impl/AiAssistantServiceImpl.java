package com.pos.service.ai.impl;

import com.pos.config.AiAssistantProperties;
import com.pos.dto.ai.AiAssistantChatMessage;
import com.pos.dto.ai.AiAssistantResponse;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.security.CurrentUserProvider;
import com.pos.service.ai.AiAssistantService;
import com.pos.service.ai.AiAssistantCompanyRepository;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiAssistantServiceImpl implements AiAssistantService {

    private final CurrentUserProvider currentUserProvider;
    private final TenantAccessSupport tenantAccess;
    private final AiAssistantProperties properties;
    private final AiAssistantRateLimiter rateLimiter;
    private final AiAssistantGeneralChatService generalChatService;
    private final AiAssistantToolRouter toolRouter;
    private final AiAssistantInsightComposer insightComposer;
    private final AiAssistantCompanyRepository companyRepository;

    @Override
    public AiAssistantResponse ask(String message, List<AiAssistantChatMessage> history) {
        long started = System.currentTimeMillis();
        User user = currentUserProvider.requireCurrentUser();
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        String normalized = normalizePrompt(message);
        List<AiAssistantChatMessage> chatHistory = AiAssistantConversationHistory.sanitize(history);
        String language = toolRouter.detectLanguage(normalized);
        rateLimiter.enforce(user.getId(), properties.getMaxRequestsPerMinutePerUser());

        AiAssistantToolCall toolCall = toolRouter.selectTool(normalized, chatHistory);

        if (AiAssistantToolCatalog.SMALLTALK.equals(toolCall.tool())) {
            String answer = generalChatService.answer(normalized, language, companyId, chatHistory);
            long latency = System.currentTimeMillis() - started;
            return new AiAssistantResponse(answer, AiAssistantToolCatalog.SMALLTALK, latency, Map.of());
        }

        Map<String, Object> toolResult = runTool(toolCall, companyId);
        String answer = insightComposer.compose(normalized, language, toolCall.tool(), toolResult, chatHistory);
        long latency = System.currentTimeMillis() - started;

        LogUtil.info(
                AiAssistantServiceImpl.class,
                "AI assistant request: user={} company={} tool={} latencyMs={} historySize={} ok=true",
                user.getId(),
                companyId,
                toolCall.tool(),
                latency,
                chatHistory.size()
        );
        return new AiAssistantResponse(answer, toolCall.tool(), latency, toolResult);
    }

    private String normalizePrompt(String message) {
        String raw = message != null ? message.trim() : "";
        raw = raw.replace('*', ' ').replaceAll("\\s+", " ").trim();
        if (!StringUtils.hasText(raw)) throw new BadRequestException("Введите вопрос");
        int maxChars = Math.max(50, properties.getMaxPromptChars());
        if (raw.length() > maxChars) throw new BadRequestException("Слишком длинный запрос");
        return raw;
    }

    private Map<String, Object> runTool(AiAssistantToolCall call, Integer companyId) {
        try {
            return companyRepository.runTool(call.tool(), call.from(), call.to(), call.query(), companyId, call.limit());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Неизвестный инструмент ассистента");
        }
    }
}
