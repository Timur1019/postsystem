package com.pos.service.ai.impl;

import java.time.LocalDate;

record AiAssistantToolCall(
        String tool,
        LocalDate from,
        LocalDate to,
        String query,
        int limit
) {
}
