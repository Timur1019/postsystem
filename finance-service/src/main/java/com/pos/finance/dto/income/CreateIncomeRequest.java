package com.pos.finance.dto.income;

import com.pos.finance.entity.IncomeSourceType;
import com.pos.finance.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateIncomeRequest(
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    @NotNull UUID accountId,
    @NotNull UUID incomeCategoryId,
    @NotNull PaymentMethod paymentMethod,
    IncomeSourceType sourceType,
    Integer storeId,
    String currency,
    String comment,
    LocalDate transactionDate
) {
}
