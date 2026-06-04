package com.pos.dto.warehouse;

import java.math.BigDecimal;
import java.util.UUID;

public record StockReceiptLineResponse(
    UUID id,
    UUID productId,
    String productName,
    String sku,
    BigDecimal quantity,
    BigDecimal purchasePrice,
    BigDecimal unitSellingPrice,
    BigDecimal lineCost
) {}
