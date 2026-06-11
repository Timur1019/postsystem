package com.pos.finance.dto.integration;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record RefundExpenseRequest(
    @NotNull Integer companyId,
    @NotNull Integer storeId,
    @NotNull UUID returnEventId,
    @NotNull UUID saleId,
    @NotBlank String receiptNumber,
    @NotNull @DecimalMin("0") BigDecimal refundAmount,
    @NotNull @DecimalMin("0") BigDecimal cashAmount,
    @NotNull @DecimalMin("0") BigDecimal cardAmount,
    @NotBlank String paymentMethod,
    LocalDate transactionDate,
    UUID createdBy
) {
}
