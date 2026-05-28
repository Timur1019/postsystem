package com.pos.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.config.AiAssistantProperties;
import com.pos.exception.BadRequestException;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DeepSeekClient {

    private final RestClient deepseekRestClient;
    private final AiAssistantProperties properties;
    private final ObjectMapper objectMapper;

    public String chat(List<Map<String, String>> messages) {
        if (!properties.isEnabled()) {
            throw new BadRequestException("ИИ ассистент отключён");
        }
        if (!StringUtils.hasText(properties.getApiKey())) {
            throw new BadRequestException("Не задан API ключ ИИ ассистента");
        }
        try {
            Map<String, Object> body = Map.of(
                    "model", properties.getModel(),
                    "temperature", 0.0,  // Deterministic output, less distortion
                    "max_tokens", 500,    // Limit response length
                    "messages", messages
            );
            JsonNode root = deepseekRestClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + properties.getApiKey())
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            String content = root != null
                    ? root.path("choices").path(0).path("message").path("content").asText("")
                    : "";
            if (!StringUtils.hasText(content)) {
                throw new BadRequestException("ИИ ассистент вернул пустой ответ");
            }
            return content;
        } catch (RestClientException ex) {
            LogUtil.error(DeepSeekClient.class, "DeepSeek API error: {}", ex.getMessage());
            throw new BadRequestException("Не удалось получить ответ от ИИ ассистента. Попробуйте позже.");
        }
    }
}