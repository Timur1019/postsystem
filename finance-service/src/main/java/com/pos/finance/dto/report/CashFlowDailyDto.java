package com.pos.finance.dto.report;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CashFlowDailyDto(
    LocalDate date,
    BigDecimal inflows,
    BigDecimal outflows,
    BigDecimal net
) {}
