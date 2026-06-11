package com.pos.finance.dto.audit;

import com.pos.finance.entity.FinanceAuditAction;
import com.pos.finance.entity.FinanceAuditEntityType;

import java.time.Instant;
import java.util.UUID;

public record FinanceAuditLogDto(
    UUID id,
    FinanceAuditEntityType entityType,
    UUID entityId,
    FinanceAuditAction action,
    String summary,
    String details,
    UUID actorId,
    Instant createdAt
) {}
