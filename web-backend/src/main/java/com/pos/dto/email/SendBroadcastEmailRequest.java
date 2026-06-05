package com.pos.dto.email;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record SendBroadcastEmailRequest(
    @NotBlank @Size(max = 200) String subject,
    @NotBlank @Size(max = 10000) String message,
    List<UUID> userIds,
    boolean selectAll
) {
}
