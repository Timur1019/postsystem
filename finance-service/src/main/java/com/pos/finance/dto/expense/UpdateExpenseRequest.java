package com.pos.finance.dto.expense;

import com.pos.finance.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateExpenseRequest(
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    @NotNull UUID accountId,
    @NotNull UUID expenseCategoryId,
    @NotNull PaymentMethod paymentMethod,
    Integer storeId,
    String comment,
    LocalDate transactionDate
) {
}
