package com.pos.dto.cashier;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CashierShiftResponse(
    UUID id,
    Integer storeId,
    String storeName,
    String cashierName,
    String status,
    Instant openedAt,
    Instant closedAt,
    int saleCount,
    BigDecimal totalAmount,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    BigDecimal vatAmount,
    Long zReportId
) {}
