package com.pos.dto.email;

public record EmailTemplatePreviewResponse(
    String subject,
    String html
) {
}
