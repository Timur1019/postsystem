package com.pos.dto.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AiAssistantRequest(
        @NotBlank String message,
        @Valid @Size(max = 24) List<AiAssistantChatMessage> history
) {
    public AiAssistantRequest {
        if (history == null) {
            history = List.of();
        } else {
            history = List.copyOf(history);
        }
    }

    public List<AiAssistantChatMessage> safeHistory() {
        return history != null ? history : List.of();
    }
}
