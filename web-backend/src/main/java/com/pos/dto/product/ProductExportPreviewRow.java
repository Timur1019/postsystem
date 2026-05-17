package com.pos.dto.product;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductExportPreviewRow(
    UUID id,
    String sku,
    String name,
    String category,
    BigDecimal baseSellingPrice,
    BigDecimal exportSellingPrice
) {
}
