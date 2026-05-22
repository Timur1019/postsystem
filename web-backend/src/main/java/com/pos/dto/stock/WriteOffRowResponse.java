package com.pos.dto.stock;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record WriteOffRowResponse(
    UUID id,
    Instant createdAt,
    UUID productId,
    String productName,
    String sku,
    int quantity,
    String reason,
    String notes,
    Integer storeId,
    String storeName,
    String createdByName,
    BigDecimal lossAmount
) {}
