package com.pos.finance.service.impl;

import com.pos.finance.dto.integration.PurchaseExpenseRequest;
import com.pos.finance.entity.AccountType;
import com.pos.finance.entity.Expense;
import com.pos.finance.entity.ExpenseCategory;
import com.pos.finance.entity.ExpenseSourceType;
import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.entity.PaymentMethod;
import com.pos.finance.repository.ExpenseRepository;
import com.pos.finance.service.PurchaseIntegrationService;
import com.pos.finance.service.support.AccountBalanceSupport;
import com.pos.finance.service.support.AccountResolverSupport;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import com.pos.finance.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseIntegrationServiceImpl implements PurchaseIntegrationService {

    private final ExpenseRepository expenseRepository;
    private final CompanyBootstrapSupport bootstrapSupport;
    private final AccountBalanceSupport balanceSupport;
    private final AccountResolverSupport accountResolver;

    @Override
    public void recordPurchaseExpense(PurchaseExpenseRequest request) {
        if (request.totalAmount() == null || request.totalAmount().signum() <= 0) {
            return;
        }
        if (expenseRepository.findByCompanyIdAndSourceTypeAndSourceIdAndDeletedFalse(
            request.companyId(), ExpenseSourceType.PURCHASE, request.receiptId().toString()
        ).isPresent()) {
            LogUtil.info(PurchaseIntegrationServiceImpl.class, "Purchase expense already recorded: receiptId={}", request.receiptId());
            return;
        }
        bootstrapSupport.ensureBootstrapped(request.companyId());
        ExpenseCategory category = bootstrapSupport.requirePurchaseCategory(request.companyId());
        FinancialAccount account = accountResolver.resolveOrCreate(request.companyId(), request.storeId(), AccountType.CASH);
        LocalDate txDate = request.transactionDate() != null ? request.transactionDate() : LocalDate.now();

        balanceSupport.debit(account, request.totalAmount());
        Expense expense = Expense.builder()
            .companyId(request.companyId())
            .storeId(request.storeId())
            .account(account)
            .amount(request.totalAmount())
            .currency("UZS")
            .paymentMethod(PaymentMethod.CASH)
            .expenseCategory(category)
            .supplierId(request.supplierId())
            .sourceType(ExpenseSourceType.PURCHASE)
            .sourceId(request.receiptId().toString())
            .comment(buildComment(request))
            .transactionDate(txDate)
            .deleted(false)
            .createdBy(request.createdBy())
            .build();
        expenseRepository.save(expense);
        LogUtil.info(PurchaseIntegrationServiceImpl.class, "Purchase expense recorded: receipt={}, amount={}",
            request.receiptId(), request.totalAmount());
    }

    private static String buildComment(PurchaseExpenseRequest request) {
        String base = "Закуп " + request.receiptNumber();
        if (request.supplierName() != null && !request.supplierName().isBlank()) {
            return base + " — " + request.supplierName();
        }
        return base;
    }
}
