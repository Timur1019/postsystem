package com.pos.dto.monitoring;

import java.time.Instant;

public record LogEventDto(
    Instant timestamp,
    String level,
    String logger,
    String thread,
    String message,
    String throwable
) {
}
