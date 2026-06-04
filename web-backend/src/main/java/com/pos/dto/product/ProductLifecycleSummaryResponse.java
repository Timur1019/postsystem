package com.pos.dto.product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProductLifecycleSummaryResponse(
    UUID productId,
    String sku,
    String name,
    BigDecimal currentStock,
    long stockDispatched,
    Instant productCreatedAt,
    long restockUnits,
    long saleUnits,
    long returnUnits,
    long writeOffUnits,
    long adjustmentNetUnits
) {}
