package com.pos.dto.report.sales;

import java.math.BigDecimal;

public record StoreSalesRowResponse(
    Integer storeId,
    String storeName,
    long receiptCount,
    long netQuantity,
    long quantityReturned,
    BigDecimal revenue,
    BigDecimal costEstimate,
    BigDecimal margin
) {}
