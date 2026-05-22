package com.pos.dto.warehouse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StockInventoryResponse(
    UUID id,
    String inventoryNumber,
    Integer storeId,
    String storeName,
    String status,
    String notes,
    int totalLines,
    int totalDifference,
    String createdByName,
    Instant createdAt,
    List<StockInventoryLineResponse> lines
) {}
