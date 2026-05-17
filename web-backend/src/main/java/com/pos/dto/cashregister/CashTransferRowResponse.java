package com.pos.dto.cashregister;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Строка журнала «Передача кассы»: агрегат по закрытой смене (Z-отчёт) с привязкой к кассе магазина.
 */
public record CashTransferRowResponse(
    Long zReportId,
    String storeName,
    Integer registerNumber,
    Instant openedAt,
    Instant closedAt,
    String cashierName,
    int salesCount,
    BigDecimal totalAmount,
    BigDecimal paymentCash,
    BigDecimal paymentCard,
    BigDecimal paymentNonCash,
    int returnsCount,
    BigDecimal returnsTotalAmount,
    BigDecimal returnsCash,
    BigDecimal returnsCard,
    BigDecimal returnsNonCash
) {}
