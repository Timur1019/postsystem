package com.pos.finance.dto.income;

import com.pos.finance.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateIncomeRequest(
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    @NotNull UUID accountId,
    @NotNull UUID incomeCategoryId,
    @NotNull PaymentMethod paymentMethod,
    Integer storeId,
    String comment,
    LocalDate transactionDate
) {
}
