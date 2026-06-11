package com.pos.finance.dto.account;

import com.pos.finance.entity.AccountType;

import java.math.BigDecimal;
import java.util.UUID;

public record FinancialAccountDto(
    UUID id,
    Integer companyId,
    Integer storeId,
    String name,
    AccountType type,
    BigDecimal balance,
    String currency,
    boolean active
) {
}
