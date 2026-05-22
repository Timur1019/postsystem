package com.pos.dto.cashier;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ShiftReportResponse(
    String reportType,
    UUID shiftId,
    Integer storeId,
    String storeName,
    String cashierName,
    Instant openedAt,
    Instant reportAt,
    int saleCount,
    BigDecimal totalAmount,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    BigDecimal vatAmount,
    BigDecimal discountTotal,
    BigDecimal lineDiscountTotal,
    BigDecimal orderDiscountTotal
) {}
