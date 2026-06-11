package com.pos.finance.dto.integration;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PurchaseExpenseRequest(
    @NotNull Integer companyId,
    @NotNull Integer storeId,
    @NotNull UUID receiptId,
    @NotBlank String receiptNumber,
    @NotNull @DecimalMin("0") BigDecimal totalAmount,
    UUID supplierId,
    String supplierName,
    LocalDate transactionDate,
    UUID createdBy
) {
}
