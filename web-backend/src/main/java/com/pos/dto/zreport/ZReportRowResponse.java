package com.pos.dto.zreport;

import java.math.BigDecimal;
import java.time.Instant;

public record ZReportRowResponse(
    Long id,
    String fiscalCardId,
    Instant openedAt,
    Instant closedAt,
    Integer zNumber,
    BigDecimal totalAmount,
    BigDecimal vatAmount,
    BigDecimal cashTotal,
    BigDecimal cardTotal,
    BigDecimal humoTotal,
    BigDecimal uzcardTotal,
    BigDecimal cashlessTotal,
    String storeName,
    String terminalSerial,
    String employeeName
) {}
