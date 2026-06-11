package com.pos.finance.dto.advance;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ApplyCustomerAdvanceRequest(
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    Integer storeId,
    String comment,
    LocalDate transactionDate
) {}
