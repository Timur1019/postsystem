package com.pos.dto.returns;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Строка журнала возвратов (аннулированные VOIDED и REFUNDED). */
public record ReturnRowResponse(
    UUID id,
    Instant createdAt,
    String fiscalModuleId,
    BigDecimal totalAmount,
    int positionsCount,
    String storeName,
    String cashierName,
    String reason,
    String status
) {}
