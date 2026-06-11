package com.pos.finance.dto.integration;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SaleIncomeRequest(
    @NotNull Integer companyId,
    @NotNull Integer storeId,
    @NotNull UUID saleId,
    @NotBlank String receiptNumber,
    @NotNull @DecimalMin("0") BigDecimal totalAmount,
    @NotNull @DecimalMin("0") BigDecimal cashAmount,
    @NotNull @DecimalMin("0") BigDecimal cardAmount,
    @NotBlank String paymentMethod,
    LocalDate transactionDate,
    UUID createdBy
) {
}
