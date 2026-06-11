package com.pos.finance.dto.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyAmountDto(LocalDate date, BigDecimal income, BigDecimal expense) {
}
