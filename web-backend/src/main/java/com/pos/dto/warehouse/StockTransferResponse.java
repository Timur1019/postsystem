package com.pos.dto.warehouse;

import java.math.BigDecimal;
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
    BigDecimal totalQuantity,
    String createdByName,
    Instant createdAt,
    List<StockTransferLineResponse> lines
) {}
