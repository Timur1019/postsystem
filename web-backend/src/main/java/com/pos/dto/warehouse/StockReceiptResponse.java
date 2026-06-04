package com.pos.dto.warehouse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StockReceiptResponse(
    UUID id,
    String receiptNumber,
    UUID supplierId,
    String supplierName,
    Integer storeId,
    String storeName,
    String notes,
    BigDecimal totalQuantity,
    BigDecimal totalCost,
    String createdByName,
    Instant createdAt,
    List<StockReceiptLineResponse> lines
) {}
