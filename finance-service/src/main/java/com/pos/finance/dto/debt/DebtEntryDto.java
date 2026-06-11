package com.pos.finance.dto.debt;

import com.pos.finance.entity.LedgerEntryType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DebtEntryDto(
    UUID id,
    LedgerEntryType entryType,
    BigDecimal amount,
    String comment,
    LocalDate transactionDate,
    UUID referenceId
) {
}
