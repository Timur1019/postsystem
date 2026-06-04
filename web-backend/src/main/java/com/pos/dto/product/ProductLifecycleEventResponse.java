package com.pos.dto.product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProductLifecycleEventResponse(
    UUID id,
    Instant occurredAt,
    String eventType,
    BigDecimal quantityDelta,
    Integer stockAfter,
    Integer storeId,
    String storeName,
    String performedBy,
    String notes,
    String writeOffReason,
    UUID referenceId,
    String referenceType,
    String referenceLabel,
    BigDecimal unitCostEstimate,
    BigDecimal costDeltaEstimate
) {}
