package com.pos.finance.dto.transfer;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AccountTransferDto(
    UUID id,
    Integer storeId,
    UUID fromAccountId,
    String fromAccountName,
    UUID toAccountId,
    String toAccountName,
    BigDecimal amount,
    String currency,
    String comment,
    LocalDate transactionDate,
    Instant createdAt
) {}
