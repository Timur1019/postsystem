package com.pos.dto.report.sales;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductSalesRowResponse(
    UUID productId,
    String productName,
    String sku,
    String barcode,
    String categoryName,
    long quantitySold,
    long quantityReturned,
    long netQuantity,
    BigDecimal revenue,
    BigDecimal costEstimate,
    BigDecimal margin
) {}
