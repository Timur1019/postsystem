package com.pos.dto.report.stock;

import java.math.BigDecimal;
import java.util.UUID;

public record StockTurnoverRowResponse(
    UUID productId,
    String productName,
    String sku,
    String categoryName,
    long openingQuantity,
    long receivedQuantity,
    long returnedQuantity,
    long soldQuantity,
    long writeOffQuantity,
    long adjustmentQuantity,
    long closingQuantity,
    BigDecimal closingCostEstimate
) {}
