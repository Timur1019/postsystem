package com.pos.finance.dto.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ProfitLossReportDto(
    LocalDate from,
    LocalDate to,
    BigDecimal totalIncome,
    BigDecimal totalExpense,
    BigDecimal grossProfit,
    BigDecimal netProfit,
    List<ProfitLossLineDto> incomeByCategory,
    List<ProfitLossLineDto> expenseByCategory
) {
}
