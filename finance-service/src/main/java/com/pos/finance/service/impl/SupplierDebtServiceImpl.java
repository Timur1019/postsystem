package com.pos.finance.service.impl;

import com.pos.finance.dto.debt.DebtBalanceDto;
import com.pos.finance.dto.debt.DebtEntryDto;
import com.pos.finance.dto.debt.PaySupplierDebtRequest;
import com.pos.finance.dto.expense.ExpenseDto;
import com.pos.finance.entity.*;
import com.pos.finance.exception.FinanceExceptions;
import com.pos.finance.mapper.FinanceMapper;
import com.pos.finance.repository.ExpenseRepository;
import com.pos.finance.repository.SupplierPayableEntryRepository;
import com.pos.finance.security.FinanceTenantContext;
import com.pos.finance.service.SupplierDebtService;
import com.pos.finance.service.support.AccountBalanceSupport;
import com.pos.finance.service.support.AccountResolverSupport;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import com.pos.finance.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SupplierDebtServiceImpl implements SupplierDebtService {

    private final SupplierPayableEntryRepository payableRepository;
    private final ExpenseRepository expenseRepository;
    private final CompanyBootstrapSupport bootstrapSupport;
    private final AccountBalanceSupport balanceSupport;
    private final AccountResolverSupport accountResolver;
    private final FinanceMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<DebtBalanceDto> listBalances() {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        return payableRepository.sumBalancesBySupplier(companyId).stream()
            .map(row -> new DebtBalanceDto((UUID) row[0], (String) row[1], (BigDecimal) row[2]))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DebtEntryDto> listEntries(UUID supplierId) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        return payableRepository
            .findByCompanyIdAndSupplierIdOrderByTransactionDateDescCreatedAtDesc(companyId, supplierId)
            .stream()
            .map(this::toEntryDto)
            .toList();
    }

    @Override
    public ExpenseDto payDebt(UUID supplierId, PaySupplierDebtRequest request) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        BigDecimal balance = payableRepository.balanceForSupplier(companyId, supplierId, LedgerEntryType.CHARGE);
        if (request.amount().compareTo(balance) > 0) {
            throw FinanceExceptions.badRequest("Сумма оплаты больше долга поставщику");
        }
        ExpenseCategory category = bootstrapSupport.requireSupplierPaymentCategory(companyId);
        FinancialAccount account = balanceSupport.requireAccount(request.accountId(), companyId);
        AccountType accountType = request.paymentMethod() == PaymentMethod.CARD ? AccountType.CARD : AccountType.CASH;
        if (account.getType() != accountType && account.getType() != AccountType.BANK) {
            account = accountResolver.resolveOrCreate(companyId, request.storeId(), accountType);
        }
        LocalDate txDate = request.transactionDate() != null ? request.transactionDate() : LocalDate.now();
        UUID paymentId = UUID.randomUUID();
        balanceSupport.debit(account, request.amount());
        Expense expense = Expense.builder()
            .companyId(companyId)
            .storeId(request.storeId())
            .account(account)
            .amount(request.amount())
            .currency("UZS")
            .paymentMethod(request.paymentMethod())
            .expenseCategory(category)
            .supplierId(supplierId)
            .sourceType(ExpenseSourceType.SUPPLIER_PAYMENT)
            .sourceId(paymentId.toString())
            .comment(request.comment() != null ? request.comment() : "Оплата поставщику")
            .transactionDate(txDate)
            .deleted(false)
            .createdBy(FinanceTenantContext.userId().orElse(null))
            .build();
        Expense savedExpense = expenseRepository.save(expense);
        String supplierName = payableRepository
            .findByCompanyIdAndSupplierIdOrderByTransactionDateDescCreatedAtDesc(companyId, supplierId)
            .stream()
            .map(SupplierPayableEntry::getSupplierName)
            .filter(n -> n != null && !n.isBlank())
            .findFirst()
            .orElse("Поставщик");
        payableRepository.save(SupplierPayableEntry.builder()
            .companyId(companyId)
            .supplierId(supplierId)
            .supplierName(supplierName)
            .storeId(request.storeId())
            .entryType(LedgerEntryType.PAYMENT)
            .amount(request.amount())
            .expenseId(savedExpense.getId())
            .sourceId("payment:" + paymentId)
            .comment(savedExpense.getComment())
            .transactionDate(txDate)
            .createdBy(FinanceTenantContext.userId().orElse(null))
            .build());
        LogUtil.info(SupplierDebtServiceImpl.class, "Supplier debt paid: supplier={}, amount={}", supplierId, request.amount());
        return mapper.toDto(savedExpense);
    }

    private DebtEntryDto toEntryDto(SupplierPayableEntry entry) {
        UUID ref = entry.getReceiptId() != null ? entry.getReceiptId() : entry.getExpenseId();
        return new DebtEntryDto(
            entry.getId(),
            entry.getEntryType(),
            entry.getAmount(),
            entry.getComment(),
            entry.getTransactionDate(),
            ref
        );
    }
}
