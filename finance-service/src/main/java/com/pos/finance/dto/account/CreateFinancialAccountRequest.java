package com.pos.finance.dto.account;

import com.pos.finance.entity.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateFinancialAccountRequest(
    @NotBlank String name,
    @NotNull AccountType type,
    Integer storeId,
    String currency,
    java.math.BigDecimal initialBalance
) {
}
