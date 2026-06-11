package com.pos.finance.dto.account;

import com.pos.finance.entity.AccountType;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record UpdateFinancialAccountRequest(
    @NotBlank String name,
    AccountType type,
    Integer storeId,
    Boolean active,
    BigDecimal balanceAdjustment,
    String adjustmentComment
) {
}
