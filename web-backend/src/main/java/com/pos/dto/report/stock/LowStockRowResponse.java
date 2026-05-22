package com.pos.dto.report.stock;

import java.math.BigDecimal;
import java.util.UUID;

public record LowStockRowResponse(
    UUID productId,
    String productName,
    String sku,
    String barcode,
    int stockQuantity,
    int lowStockAlert,
    int deficit,
    BigDecimal costPrice,
    BigDecimal stockValueEstimate
) {}
