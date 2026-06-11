package com.pos.finance.dto.report;

import java.math.BigDecimal;

public record ProfitLossLineDto(String name, BigDecimal amount) {
}
