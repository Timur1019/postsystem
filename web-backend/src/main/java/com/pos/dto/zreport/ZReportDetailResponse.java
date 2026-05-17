package com.pos.dto.zreport;

import java.math.BigDecimal;
import java.time.Instant;

/** Полные данные Z-отчёта для печати и детального просмотра. */
public record ZReportDetailResponse(
    Long id,
    String fiscalCardId,
    String terminalSerial,
    Instant openedAt,
    Instant closedAt,
    Integer zNumber,
    BigDecimal totalAmount,
    BigDecimal vatAmount,
    String storeName,
    String employeeName,
    String brandName,
    String companyName,
    String companyAddress,
    String tin,
    String appletVersion,
    BigDecimal cashTotal,
    BigDecimal cardTotal,
    BigDecimal returnsCash,
    BigDecimal returnsCard,
    BigDecimal vatReturn,
    Integer salesCount,
    Integer returnsCount,
    String firstReceiptNumber,
    String lastReceiptNumber
) {}
