package com.pos.finance.dto.expense;

import com.pos.finance.entity.ExpenseSourceType;
import com.pos.finance.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ExpenseDto(
    UUID id,
    Integer storeId,
    UUID accountId,
    String accountName,
    BigDecimal amount,
    String currency,
    PaymentMethod paymentMethod,
    UUID expenseCategoryId,
    String expenseCategoryName,
    ExpenseSourceType sourceType,
    String sourceId,
    String comment,
    LocalDate transactionDate
) {
}
