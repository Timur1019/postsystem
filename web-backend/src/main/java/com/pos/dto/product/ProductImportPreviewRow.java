package com.pos.dto.product;

import java.math.BigDecimal;

public record ProductImportPreviewRow(
    int rowNum,
    String sku,
    String name,
    String ikpu,
    String unitOfMeasure,
    int quantity,
    BigDecimal fileSellingPrice,
    BigDecimal existingSellingPrice,
    BigDecimal taxRatePercent,
    String status,
    String existingSku,
    String existingName,
    String message
) {
    public static final String STATUS_NEW = "NEW";
    public static final String STATUS_DUPLICATE = "DUPLICATE";
    public static final String STATUS_INVALID = "INVALID";
}
