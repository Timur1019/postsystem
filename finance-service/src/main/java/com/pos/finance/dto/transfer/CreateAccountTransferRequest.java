package com.pos.finance.dto.transfer;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateAccountTransferRequest(
    @NotNull UUID fromAccountId,
    @NotNull UUID toAccountId,
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    Integer storeId,
    String comment,
    LocalDate transactionDate
) {}
