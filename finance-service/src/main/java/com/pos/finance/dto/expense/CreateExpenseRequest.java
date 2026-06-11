package com.pos.finance.dto.expense;

import com.pos.finance.entity.ExpenseSourceType;
import com.pos.finance.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateExpenseRequest(
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    @NotNull UUID accountId,
    @NotNull UUID expenseCategoryId,
    @NotNull PaymentMethod paymentMethod,
    ExpenseSourceType sourceType,
    Integer storeId,
    UUID supplierId,
    UUID employeeId,
    String currency,
    String comment,
    LocalDate transactionDate
) {
}
