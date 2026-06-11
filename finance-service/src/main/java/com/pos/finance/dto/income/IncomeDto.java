package com.pos.finance.dto.income;

import com.pos.finance.entity.IncomeSourceType;
import com.pos.finance.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record IncomeDto(
    UUID id,
    Integer storeId,
    UUID accountId,
    String accountName,
    BigDecimal amount,
    String currency,
    PaymentMethod paymentMethod,
    UUID incomeCategoryId,
    String incomeCategoryName,
    IncomeSourceType sourceType,
    String sourceId,
    String comment,
    LocalDate transactionDate
) {
}
