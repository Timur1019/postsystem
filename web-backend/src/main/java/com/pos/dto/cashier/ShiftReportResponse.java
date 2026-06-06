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
    BigDecimal humoAmount,
    BigDecimal uzcardAmount,
    BigDecimal cashlessAmount,
    BigDecimal vatAmount,
    BigDecimal discountTotal,
    BigDecimal lineDiscountTotal,
    BigDecimal orderDiscountTotal,
    int returnsCount,
    BigDecimal returnsCash,
    BigDecimal returnsCard,
    BigDecimal returnsHumo,
    BigDecimal returnsUzcard,
    BigDecimal returnsCashless,
    BigDecimal returnsVat
) {}
