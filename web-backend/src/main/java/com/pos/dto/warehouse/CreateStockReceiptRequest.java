package com.pos.dto.warehouse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record CreateStockReceiptRequest(
    UUID supplierId,
    Integer storeId,
    String notes,
    @NotEmpty @Valid List<StockReceiptLineRequest> lines
) {}
