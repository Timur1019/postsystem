package com.pos.dto.email;

import com.pos.email.EmailTemplateType;
import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

public record EmailTemplatePreviewRequest(
    @NotNull EmailTemplateType templateType,
    String subject,
    String message,
    UUID sampleUserId,
    Map<String, String> overrides
) {
}
