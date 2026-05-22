package com.pos.dto.warehouse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StockTransferResponse(
    UUID id,
    String transferNumber,
    Integer fromStoreId,
    String fromStoreName,
    Integer toStoreId,
    String toStoreName,
    String notes,
    int totalQuantity,
    String createdByName,
    Instant createdAt,
    List<StockTransferLineResponse> lines
) {}
