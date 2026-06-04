package com.pos.dto.report.stock;

import java.math.BigDecimal;
import java.util.UUID;

public record StockBalanceRowResponse(
    UUID productId,
    String productName,
    String sku,
    String barcode,
    String categoryName,
    BigDecimal stockQuantity,
    int lowStockAlert,
    BigDecimal costPrice,
    BigDecimal stockValue
) {}
