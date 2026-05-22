package com.pos.dto.report.stock;

import java.time.Instant;
import java.util.UUID;

public record StockMovementRowResponse(
    UUID id,
    Instant createdAt,
    String movementType,
    UUID productId,
    String productName,
    String sku,
    int quantity,
    String notes,
    String writeOffReason,
    Integer storeId,
    String storeName,
    String createdByName,
    UUID referenceId,
    String receiptNumber
) {}
