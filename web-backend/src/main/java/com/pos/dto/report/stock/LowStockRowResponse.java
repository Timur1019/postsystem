package com.pos.dto.report.stock;

import java.math.BigDecimal;
import java.util.UUID;

public record LowStockRowResponse(
    UUID productId,
    String productName,
    String sku,
    String barcode,
    BigDecimal stockQuantity,
    int lowStockAlert,
    BigDecimal deficit,
    BigDecimal costPrice,
    BigDecimal stockValueEstimate
) {}
