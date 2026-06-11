package com.pos.finance.dto.debt;

import java.math.BigDecimal;
import java.util.UUID;

public record DebtBalanceDto(
    UUID counterpartyId,
    String counterpartyName,
    BigDecimal balance
) {
}
