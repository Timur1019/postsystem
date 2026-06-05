package com.pos.dto.email;

import java.util.List;

public record EmailTemplateInfoResponse(
    String type,
    String title,
    String description,
    List<String> variables
) {
}
