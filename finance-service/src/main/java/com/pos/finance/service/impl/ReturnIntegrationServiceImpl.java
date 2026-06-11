package com.pos.finance.service.impl;

import com.pos.finance.dto.integration.RefundExpenseRequest;
import com.pos.finance.entity.AccountType;
import com.pos.finance.entity.Expense;
import com.pos.finance.entity.ExpenseCategory;
import com.pos.finance.entity.ExpenseSourceType;
import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.entity.PaymentMethod;
import com.pos.finance.repository.ExpenseRepository;
import com.pos.finance.service.ReturnIntegrationService;
import com.pos.finance.service.support.AccountBalanceSupport;
import com.pos.finance.service.support.AccountResolverSupport;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import com.pos.finance.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class ReturnIntegrationServiceImpl implements ReturnIntegrationService {

    private final ExpenseRepository expenseRepository;
    private final CompanyBootstrapSupport bootstrapSupport;
    private final AccountBalanceSupport balanceSupport;
    private final AccountResolverSupport accountResolver;

    @Override
    public void recordRefundExpense(RefundExpenseRequest request) {
        if (request.refundAmount() == null || request.refundAmount().signum() <= 0) {
            return;
        }
        if (expenseRepository.existsByCompanyIdAndSourceTypeAndSourceIdAndDeletedFalse(
            request.companyId(), ExpenseSourceType.REFUND, request.returnEventId().toString()
        )) {
            LogUtil.info(ReturnIntegrationServiceImpl.class, "Refund expense already recorded: event={}", request.returnEventId());
            return;
        }
        bootstrapSupport.ensureBootstrapped(request.companyId());
        ExpenseCategory category = bootstrapSupport.requireRefundCategory(request.companyId());
        LocalDate txDate = request.transactionDate() != null ? request.transactionDate() : LocalDate.now();

        if (request.cashAmount().signum() > 0) {
            recordPart(request, category, txDate, request.cashAmount(), PaymentMethod.CASH, AccountType.CASH);
        }
        if (request.cardAmount().signum() > 0) {
            recordPart(request, category, txDate, request.cardAmount(), PaymentMethod.CARD, AccountType.CARD);
        }
        if (request.cashAmount().signum() == 0 && request.cardAmount().signum() == 0) {
            PaymentMethod method = mapPaymentMethod(request.paymentMethod());
            AccountType accountType = method == PaymentMethod.CARD ? AccountType.CARD : AccountType.CASH;
            recordPart(request, category, txDate, request.refundAmount(), method, accountType);
        }
    }

    private void recordPart(
        RefundExpenseRequest request,
        ExpenseCategory category,
        LocalDate txDate,
        BigDecimal amount,
        PaymentMethod paymentMethod,
        AccountType accountType
    ) {
        FinancialAccount account = accountResolver.resolveOrCreate(request.companyId(), request.storeId(), accountType);
        balanceSupport.debit(account, amount);
        Expense expense = Expense.builder()
            .companyId(request.companyId())
            .storeId(request.storeId())
            .account(account)
            .amount(amount)
            .currency("UZS")
            .paymentMethod(paymentMethod)
            .expenseCategory(category)
            .sourceType(ExpenseSourceType.REFUND)
            .sourceId(request.returnEventId().toString())
            .comment("Возврат " + request.receiptNumber())
            .transactionDate(txDate)
            .deleted(false)
            .createdBy(request.createdBy())
            .build();
        expenseRepository.save(expense);
        LogUtil.info(
            ReturnIntegrationServiceImpl.class,
            "Refund expense recorded: sale={}, event={}, amount={}",
            request.saleId(),
            request.returnEventId(),
            amount
        );
    }

    private static PaymentMethod mapPaymentMethod(String method) {
        if (method == null) {
            return PaymentMethod.CASH;
        }
        return switch (method.toUpperCase()) {
            case "CARD", "MIXED" -> PaymentMethod.CARD;
            case "CASHLESS", "BANK", "TRANSFER" -> PaymentMethod.BANK;
            default -> PaymentMethod.CASH;
        };
    }
}
