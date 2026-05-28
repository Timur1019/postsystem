package com.pos.dto.ai;

import java.util.Map;

public record AiAssistantResponse(
    String answer,
    String tool,
    long latencyMs,
    Map<String, Object> data
) {
}

