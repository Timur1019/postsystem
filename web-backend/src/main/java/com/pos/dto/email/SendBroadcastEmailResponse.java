package com.pos.dto.email;

public record SendBroadcastEmailResponse(
    int sent,
    int failed,
    int skipped
) {
}
