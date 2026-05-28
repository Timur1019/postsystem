package com.pos.dto.ai;

import jakarta.validation.constraints.NotBlank;

public record AiAssistantRequest(
    @NotBlank String message
) {
}

