package com.pos.finance.dto.integration;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AdvanceSaleDepositRequest(
    @NotNull Integer companyId,
    @NotNull Integer storeId,
    @NotNull UUID customerId,
    @NotBlank String customerName,
    @NotNull UUID saleId,
    @NotBlank String receiptNumber,
    @NotNull @DecimalMin("0.01") BigDecimal totalAmount,
    LocalDate transactionDate,
    UUID createdBy
) {}
