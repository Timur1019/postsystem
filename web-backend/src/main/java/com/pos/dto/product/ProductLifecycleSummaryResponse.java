package com.pos.dto.product;

import java.time.Instant;
import java.util.UUID;

public record ProductLifecycleSummaryResponse(
    UUID productId,
    String sku,
    String name,
    int currentStock,
    long stockDispatched,
    Instant productCreatedAt,
    long restockUnits,
    long saleUnits,
    long returnUnits,
    long writeOffUnits,
    long adjustmentNetUnits
) {}
