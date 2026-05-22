package com.pos.dto.report.sales;

import java.math.BigDecimal;

public record CategorySalesRowResponse(
    Integer categoryId,
    String categoryName,
    long receiptCount,
    long netQuantity,
    long quantityReturned,
    BigDecimal revenue,
    BigDecimal costEstimate,
    BigDecimal margin
) {}
