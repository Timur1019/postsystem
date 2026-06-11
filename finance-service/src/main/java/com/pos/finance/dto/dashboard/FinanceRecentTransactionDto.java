package com.pos.finance.dto.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FinanceRecentTransactionDto(
    String type,
    String title,
    BigDecimal amount,
    LocalDate transactionDate,
    String sourceType
) {
}
