package com.pos.finance.service.impl;

import com.pos.finance.dto.dashboard.DailyAmountDto;
import com.pos.finance.dto.dashboard.ExpenseCategorySummaryDto;
import com.pos.finance.dto.dashboard.FinanceDashboardDto;
import com.pos.finance.dto.dashboard.FinanceRecentTransactionDto;
import com.pos.finance.entity.AccountType;
import com.pos.finance.entity.Expense;
import com.pos.finance.entity.ExpenseSourceType;
import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.entity.Income;
import com.pos.finance.entity.IncomeSourceType;
import com.pos.finance.exception.FinanceExceptions;
import com.pos.finance.repository.ExpenseRepository;
import com.pos.finance.repository.FinancialAccountRepository;
import com.pos.finance.repository.IncomeRepository;
import com.pos.finance.security.FinanceTenantContext;
import com.pos.finance.service.DashboardService;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private static final int MAX_CHART_DAYS = 93;

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final FinancialAccountRepository accountRepository;
    private final CompanyBootstrapSupport bootstrapSupport;

    @Override
    public FinanceDashboardDto getDashboard(Integer storeId, LocalDate from, LocalDate to) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate weekStart = today.minusDays(6);

        boolean customPeriod = from != null && to != null;
        if (customPeriod) {
            if (to.isBefore(from)) {
                throw FinanceExceptions.badRequest("Дата «по» не может быть раньше «с»");
            }
            if (ChronoUnit.DAYS.between(from, to) > MAX_CHART_DAYS) {
                throw FinanceExceptions.badRequest("Период не может быть больше " + MAX_CHART_DAYS + " дней");
            }
        }

        LocalDate periodStart = customPeriod ? from : monthStart;
        LocalDate periodEnd = customPeriod ? to : today;
        LocalDate chartStart = customPeriod ? from : weekStart;
        LocalDate chartEnd = customPeriod ? to : today;

        BigDecimal revenueToday = incomeRepository.sumByPeriod(companyId, today, today, storeId);
        BigDecimal revenueWeek = incomeRepository.sumByPeriod(companyId, weekStart, today, storeId);
        BigDecimal revenueMonth = incomeRepository.sumByPeriod(companyId, periodStart, periodEnd, storeId);
        BigDecimal expensesToday = expenseRepository.sumByPeriod(companyId, today, today, storeId);
        BigDecimal expensesWeek = expenseRepository.sumByPeriod(companyId, weekStart, today, storeId);
        BigDecimal expensesMonth = expenseRepository.sumByPeriod(companyId, periodStart, periodEnd, storeId);

        BigDecimal salesIncomeToday = incomeRepository.sumBySourceAndPeriod(
            companyId, IncomeSourceType.SALE, today, today, storeId
        );
        BigDecimal salesIncomeMonth = incomeRepository.sumBySourceAndPeriod(
            companyId, IncomeSourceType.SALE, periodStart, periodEnd, storeId
        );
        BigDecimal purchaseExpenseMonth = expenseRepository.sumBySourceAndPeriod(
            companyId, ExpenseSourceType.PURCHASE, periodStart, periodEnd, storeId
        );
        long salesCountToday = incomeRepository.countBySourceAndPeriod(
            companyId, IncomeSourceType.SALE, today, today, storeId
        );

        List<FinancialAccount> accounts = accountRepository.findByCompanyIdAndDeletedFalseOrderByNameAsc(companyId);
        BigDecimal cashInRegisters = accounts.stream()
            .filter(a -> a.getType() == AccountType.CASH)
            .filter(a -> storeId == null || storeId.equals(a.getStoreId()))
            .map(FinancialAccount::getBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal moneyInBanks = accounts.stream()
            .filter(a -> a.getType() == AccountType.BANK || a.getType() == AccountType.CARD)
            .map(FinancialAccount::getBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ExpenseCategorySummaryDto> topExpenses = expenseRepository
            .sumByCategory(companyId, periodStart, periodEnd, storeId).stream()
            .limit(5)
            .map(row -> new ExpenseCategorySummaryDto((String) row[0], (BigDecimal) row[1]))
            .toList();

        return new FinanceDashboardDto(
            revenueToday,
            revenueWeek,
            revenueMonth,
            expensesToday,
            expensesWeek,
            expensesMonth,
            revenueMonth.subtract(expensesMonth),
            cashInRegisters,
            moneyInBanks,
            salesIncomeToday,
            salesIncomeMonth,
            purchaseExpenseMonth,
            salesCountToday,
            topExpenses,
            buildRecentTransactions(companyId, storeId, customPeriod ? periodStart : null, customPeriod ? periodEnd : null),
            buildDailyChart(companyId, storeId, chartStart, chartEnd)
        );
    }

    private List<FinanceRecentTransactionDto> buildRecentTransactions(
        Integer companyId,
        Integer storeId,
        LocalDate from,
        LocalDate to
    ) {
        List<FinanceRecentTransactionDto> items = new ArrayList<>();
        PageRequest page = PageRequest.of(0, 8);
        List<Income> incomes = from != null
            ? incomeRepository.findRecentInPeriod(companyId, from, to, storeId, page)
            : incomeRepository.findRecent(companyId, storeId, page);
        for (Income income : incomes) {
            items.add(new FinanceRecentTransactionDto(
                "INCOME",
                income.getComment() != null ? income.getComment() : income.getIncomeCategory().getName(),
                income.getAmount(),
                income.getTransactionDate(),
                income.getSourceType().name()
            ));
        }
        List<Expense> expenses = from != null
            ? expenseRepository.findRecentInPeriod(companyId, from, to, storeId, page)
            : expenseRepository.findRecent(companyId, storeId, page);
        for (Expense expense : expenses) {
            items.add(new FinanceRecentTransactionDto(
                "EXPENSE",
                expense.getComment() != null ? expense.getComment() : expense.getExpenseCategory().getName(),
                expense.getAmount(),
                expense.getTransactionDate(),
                expense.getSourceType().name()
            ));
        }
        return items.stream()
            .sorted(Comparator
                .comparing(FinanceRecentTransactionDto::transactionDate).reversed()
                .thenComparing(FinanceRecentTransactionDto::type))
            .limit(12)
            .toList();
    }

    private List<DailyAmountDto> buildDailyChart(Integer companyId, Integer storeId, LocalDate from, LocalDate to) {
        Map<LocalDate, BigDecimal> incomeByDay = new HashMap<>();
        for (Object[] row : incomeRepository.sumDailyByPeriod(companyId, from, to, storeId)) {
            incomeByDay.put((LocalDate) row[0], (BigDecimal) row[1]);
        }
        Map<LocalDate, BigDecimal> expenseByDay = new HashMap<>();
        for (Object[] row : expenseRepository.sumDailyByPeriod(companyId, from, to, storeId)) {
            expenseByDay.put((LocalDate) row[0], (BigDecimal) row[1]);
        }

        List<DailyAmountDto> days = new ArrayList<>();
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            days.add(new DailyAmountDto(
                day,
                incomeByDay.getOrDefault(day, BigDecimal.ZERO),
                expenseByDay.getOrDefault(day, BigDecimal.ZERO)
            ));
        }
        return days;
    }
}
