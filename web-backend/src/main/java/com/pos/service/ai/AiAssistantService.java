package com.pos.service.ai;

import com.pos.dto.ai.AiAssistantResponse;

public interface AiAssistantService {
    AiAssistantResponse ask(String message);
}
