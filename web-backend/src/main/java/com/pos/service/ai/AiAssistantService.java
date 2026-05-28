package com.pos.service.ai;

import com.pos.dto.ai.AiAssistantChatMessage;
import com.pos.dto.ai.AiAssistantResponse;

import java.util.List;

public interface AiAssistantService {
    AiAssistantResponse ask(String message, List<AiAssistantChatMessage> history);
}
