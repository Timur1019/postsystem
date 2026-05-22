package com.pos.dto.warehouse;

import java.util.UUID;

public record StockTransferLineResponse(
    UUID id,
    UUID productId,
    String productName,
    String sku,
    int quantity
) {}
