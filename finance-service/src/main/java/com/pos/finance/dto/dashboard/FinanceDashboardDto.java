package com.pos.finance.dto.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record FinanceDashboardDto(
    BigDecimal revenueToday,
    BigDecimal revenueWeek,
    BigDecimal revenueMonth,
    BigDecimal expensesToday,
    BigDecimal expensesWeek,
    BigDecimal expensesMonth,
    BigDecimal netProfitMonth,
    BigDecimal cashInRegisters,
    BigDecimal moneyInBanks,
    BigDecimal salesIncomeToday,
    BigDecimal salesIncomeMonth,
    BigDecimal purchaseExpenseMonth,
    long salesCountToday,
    List<ExpenseCategorySummaryDto> topExpenseCategories,
    List<FinanceRecentTransactionDto> recentTransactions,
    List<DailyAmountDto> last7Days
) {
}
