package com.pos.finance.dto.debt;

import com.pos.finance.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PayCustomerDebtRequest(
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    @NotNull UUID accountId,
    @NotNull PaymentMethod paymentMethod,
    Integer storeId,
    String comment,
    LocalDate transactionDate
) {
}
