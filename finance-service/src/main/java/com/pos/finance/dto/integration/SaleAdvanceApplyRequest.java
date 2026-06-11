package com.pos.finance.dto.integration;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SaleAdvanceApplyRequest(
    @NotNull Integer companyId,
    @NotNull Integer storeId,
    @NotNull UUID saleId,
    @NotBlank String receiptNumber,
    @NotNull UUID customerId,
    String customerName,
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    LocalDate transactionDate,
    UUID createdBy
) {}
