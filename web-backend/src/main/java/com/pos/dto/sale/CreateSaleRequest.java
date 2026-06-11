package com.pos.dto.sale;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateSaleRequest(
    @NotEmpty @Valid List<SaleItemRequest> items,
    @NotBlank String paymentMethod,
    Integer storeId,
    /** Доля наличными (для MIXED). */
    BigDecimal cashAmount,
    /** Доля картой (для MIXED; можно не передавать — остаток от total). */
    BigDecimal cardAmount,
    BigDecimal amountTendered,
    String notes,
    UUID customerId,
    String receiptType,
    String cardType,
    /** Скидка на весь чек (сумма), после скидок по строкам. */
    @DecimalMin("0") BigDecimal orderDiscountAmount,
    /** Скидка на чек, % (опционально, для отчётов). */
    @DecimalMin("0") BigDecimal orderDiscountPercent,
    /** Оплата с аванса клиента (для SALE с customerId). */
    @DecimalMin("0") BigDecimal advanceAmount
) {}
