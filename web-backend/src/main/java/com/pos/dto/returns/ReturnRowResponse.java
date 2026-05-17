package com.pos.dto.returns;

import java.math.BigDecimal;
import java.time.Instant;

/** Строка журнала возвратов (аннулированные VOIDED и REFUNDED). */
public record ReturnRowResponse(
    Instant createdAt,
    String fiscalModuleId,
    BigDecimal totalAmount,
    int positionsCount,
    String storeName
) {}
