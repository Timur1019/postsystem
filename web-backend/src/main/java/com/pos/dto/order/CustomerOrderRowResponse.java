package com.pos.dto.order;

import java.math.BigDecimal;
import java.time.Instant;

public record CustomerOrderRowResponse(
    long id,
    Instant createdAt,
    String storeName,
    String externalNumber,
    String receiptNumber,
    Instant receiptAt,
    String paymentMethod,
    String clientName,
    String courierName,
    BigDecimal totalAmount,
    String status
) {}
