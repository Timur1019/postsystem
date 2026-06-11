package com.pos.finance.service.impl;

import com.pos.finance.dto.integration.SaleIncomeRequest;
import com.pos.finance.entity.AccountType;
import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.entity.Income;
import com.pos.finance.entity.IncomeCategory;
import com.pos.finance.entity.IncomeSourceType;
import com.pos.finance.entity.PaymentMethod;
import com.pos.finance.repository.IncomeRepository;
import com.pos.finance.service.SaleIntegrationService;
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
public class SaleIntegrationServiceImpl implements SaleIntegrationService {

    private final IncomeRepository incomeRepository;
    private final CompanyBootstrapSupport bootstrapSupport;
    private final AccountBalanceSupport balanceSupport;
    private final AccountResolverSupport accountResolver;

    @Override
    public void recordSaleIncome(SaleIncomeRequest request) {
        if (incomeRepository.findByCompanyIdAndSourceTypeAndSourceIdAndDeletedFalse(
            request.companyId(), IncomeSourceType.SALE, request.saleId().toString()
        ).isPresent()) {
            LogUtil.info(SaleIntegrationServiceImpl.class, "Sale income already recorded: saleId={}", request.saleId());
            return;
        }
        bootstrapSupport.ensureBootstrapped(request.companyId());
        IncomeCategory salesCategory = bootstrapSupport.requireSalesCategory(request.companyId());
        LocalDate txDate = request.transactionDate() != null ? request.transactionDate() : LocalDate.now();

        if (request.cashAmount().signum() > 0) {
            recordPart(request, salesCategory, txDate, request.cashAmount(), PaymentMethod.CASH, AccountType.CASH);
        }
        if (request.cardAmount().signum() > 0) {
            recordPart(request, salesCategory, txDate, request.cardAmount(), PaymentMethod.CARD, AccountType.CARD);
        }
        if (request.cashAmount().signum() == 0 && request.cardAmount().signum() == 0
            && request.totalAmount().signum() > 0) {
            PaymentMethod method = mapPaymentMethod(request.paymentMethod());
            AccountType accountType = method == PaymentMethod.CARD ? AccountType.CARD : AccountType.CASH;
            recordPart(request, salesCategory, txDate, request.totalAmount(), method, accountType);
        }
    }

    private void recordPart(
        SaleIncomeRequest request,
        IncomeCategory category,
        LocalDate txDate,
        BigDecimal amount,
        PaymentMethod paymentMethod,
        AccountType accountType
    ) {
        FinancialAccount account = accountResolver.resolveOrCreate(request.companyId(), request.storeId(), accountType);
        Income income = Income.builder()
            .companyId(request.companyId())
            .storeId(request.storeId())
            .account(account)
            .amount(amount)
            .currency("UZS")
            .paymentMethod(paymentMethod)
            .incomeCategory(category)
            .sourceType(IncomeSourceType.SALE)
            .sourceId(request.saleId().toString())
            .comment("Продажа " + request.receiptNumber())
            .transactionDate(txDate)
            .deleted(false)
            .createdBy(request.createdBy())
            .build();
        incomeRepository.save(income);
        balanceSupport.credit(account, amount);
        LogUtil.info(SaleIntegrationServiceImpl.class, "Sale income recorded: sale={}, amount={}, account={}",
            request.saleId(), amount, account.getName());
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
