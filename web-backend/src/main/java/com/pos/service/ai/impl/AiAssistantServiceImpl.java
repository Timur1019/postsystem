package com.pos.service.ai.impl;

import com.pos.config.AiAssistantProperties;
import com.pos.dto.ai.AiAssistantResponse;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.security.CurrentUserProvider;
import com.pos.service.ai.AiAssistantService;
import com.pos.service.ai.AnalyticsToolFacade;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiAssistantServiceImpl implements AiAssistantService {

    private final AnalyticsToolFacade toolFacade;
    private final CurrentUserProvider currentUserProvider;
    private final TenantAccessSupport tenantAccess;
    private final AiAssistantProperties properties;
    private final AiAssistantRateLimiter rateLimiter;
    private final AiAssistantGeneralChatService generalChatService;
    private final AiAssistantToolRouter toolRouter;
    private final AiAssistantInsightComposer insightComposer;

    @Override
    public AiAssistantResponse ask(String message) {
        long started = System.currentTimeMillis();
        User user = currentUserProvider.requireCurrentUser();
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        String normalized = normalizePrompt(message);
        String language = toolRouter.detectLanguage(normalized);
        rateLimiter.enforce(user.getId(), properties.getMaxRequestsPerMinutePerUser());

        if (toolRouter.isSmallTalk(normalized)) {
            long latency = System.currentTimeMillis() - started;
            String answer = generalChatService.answer(normalized, language, companyId);
            return new AiAssistantResponse(answer, AiAssistantToolCatalog.SMALLTALK, latency, Map.of());
        }

        AiAssistantToolCall toolCall = toolRouter.selectTool(normalized);

        if (AiAssistantToolCatalog.SMALLTALK.equals(toolCall.tool())) {
            long latency = System.currentTimeMillis() - started;
            String answer = generalChatService.answer(normalized, language, companyId);
            return new AiAssistantResponse(answer, AiAssistantToolCatalog.SMALLTALK, latency, Map.of());
        }

        Map<String, Object> toolResult = runTool(toolCall, companyId);
        String answer = insightComposer.compose(normalized, language, toolCall.tool(), toolResult);
        long latency = System.currentTimeMillis() - started;

        LogUtil.info(
                AiAssistantServiceImpl.class,
                "AI assistant request: user={} company={} tool={} latencyMs={} ok=true",
                user.getId(),
                companyId,
                toolCall.tool(),
                latency
        );
        return new AiAssistantResponse(answer, toolCall.tool(), latency, toolResult);
    }

    private String normalizePrompt(String message) {
        String raw = message != null ? message.trim() : "";
        if (!StringUtils.hasText(raw)) throw new BadRequestException("Введите вопрос");
        int maxChars = Math.max(50, properties.getMaxPromptChars());
        if (raw.length() > maxChars) throw new BadRequestException("Слишком длинный запрос");
        return raw;
    }

    private Map<String, Object> runTool(AiAssistantToolCall call, Integer companyId) {
        return switch (call.tool()) {
            case AiAssistantToolCatalog.TODAY_REVENUE -> toolFacade.todayRevenue(companyId);
            case AiAssistantToolCatalog.SALES_PERIOD -> toolFacade.salesPeriodOverview(call.from(), call.to(), companyId);
            case AiAssistantToolCatalog.INVENTORY -> toolFacade.inventoryOverview(call.from(), call.to(), companyId);
            case AiAssistantToolCatalog.TOP_PRODUCTS -> toolFacade.topProductsPeriod(call.from(), call.to(), call.limit());
            case AiAssistantToolCatalog.RETURNS_SUMMARY -> toolFacade.returnsSummaryPeriod(call.from(), call.to(), companyId);
            case AiAssistantToolCatalog.REDISTRIBUTION -> toolFacade.stockRedistributionSuggestion(call.from(), call.to(), companyId);
            case AiAssistantToolCatalog.STORE_INSIGHT -> toolFacade.storeSalesAndStockInsight(call.from(), call.to(), companyId);
            case AiAssistantToolCatalog.BUSINESS_HEALTH -> toolFacade.businessHealthCheck(call.from(), call.to(), companyId);
            default -> throw new BadRequestException("Неизвестный инструмент ассистента");
        };
    }

}