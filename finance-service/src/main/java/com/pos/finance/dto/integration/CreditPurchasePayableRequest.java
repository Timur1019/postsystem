package com.pos.finance.dto.integration;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreditPurchasePayableRequest(
    @NotNull Integer companyId,
    @NotNull Integer storeId,
    @NotNull UUID receiptId,
    @NotBlank String receiptNumber,
    @NotNull @DecimalMin("0.01") BigDecimal totalAmount,
    @NotNull UUID supplierId,
    @NotBlank String supplierName,
    LocalDate transactionDate,
    UUID createdBy
) {
}
