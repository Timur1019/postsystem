package com.pos.dto.warehouse;

import java.util.UUID;

public record StockInventoryLineResponse(
    UUID id,
    UUID productId,
    String productName,
    String sku,
    int systemQuantity,
    int countedQuantity,
    int difference
) {}
