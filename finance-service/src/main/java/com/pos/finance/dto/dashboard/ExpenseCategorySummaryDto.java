package com.pos.finance.dto.dashboard;

import java.math.BigDecimal;

public record ExpenseCategorySummaryDto(String categoryName, BigDecimal amount) {
}
