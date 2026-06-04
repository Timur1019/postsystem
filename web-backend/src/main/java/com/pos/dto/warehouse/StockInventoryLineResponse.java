package com.pos.dto.warehouse;

import java.math.BigDecimal;
import java.util.UUID;

public record StockInventoryLineResponse(
    UUID id,
    UUID productId,
    String productName,
    String sku,
    BigDecimal systemQuantity,
    BigDecimal countedQuantity,
    BigDecimal difference
) {}
