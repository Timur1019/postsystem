package com.pos.finance.service.impl;

import com.pos.finance.dto.debt.DebtBalanceDto;
import com.pos.finance.dto.debt.DebtEntryDto;
import com.pos.finance.dto.debt.PayCustomerDebtRequest;
import com.pos.finance.dto.income.IncomeDto;
import com.pos.finance.entity.*;
import com.pos.finance.exception.FinanceExceptions;
import com.pos.finance.mapper.FinanceMapper;
import com.pos.finance.repository.CustomerReceivableEntryRepository;
import com.pos.finance.repository.IncomeRepository;
import com.pos.finance.security.FinanceTenantContext;
import com.pos.finance.service.CustomerDebtService;
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
public class CustomerDebtServiceImpl implements CustomerDebtService {

    private final CustomerReceivableEntryRepository receivableRepository;
    private final IncomeRepository incomeRepository;
    private final CompanyBootstrapSupport bootstrapSupport;
    private final AccountBalanceSupport balanceSupport;
    private final AccountResolverSupport accountResolver;
    private final FinanceMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<DebtBalanceDto> listBalances() {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        return receivableRepository.sumBalancesByCustomer(companyId).stream()
            .map(row -> new DebtBalanceDto((UUID) row[0], (String) row[1], (BigDecimal) row[2]))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DebtEntryDto> listEntries(UUID customerId) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        return receivableRepository
            .findByCompanyIdAndCustomerIdOrderByTransactionDateDescCreatedAtDesc(companyId, customerId)
            .stream()
            .map(this::toEntryDto)
            .toList();
    }

    @Override
    public IncomeDto payDebt(UUID customerId, PayCustomerDebtRequest request) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        BigDecimal balance = receivableRepository.balanceForCustomer(companyId, customerId, LedgerEntryType.CHARGE);
        if (request.amount().compareTo(balance) > 0) {
            throw FinanceExceptions.badRequest("Сумма оплаты больше долга клиента");
        }
        IncomeCategory category = bootstrapSupport.requireClientDebtPaymentCategory(companyId);
        FinancialAccount account = balanceSupport.requireAccount(request.accountId(), companyId);
        AccountType accountType = request.paymentMethod() == PaymentMethod.CARD ? AccountType.CARD : AccountType.CASH;
        if (account.getType() != accountType && account.getType() != AccountType.BANK) {
            account = accountResolver.resolveOrCreate(companyId, request.storeId(), accountType);
        }
        LocalDate txDate = request.transactionDate() != null ? request.transactionDate() : LocalDate.now();
        UUID paymentId = UUID.randomUUID();
        balanceSupport.credit(account, request.amount());
        Income income = Income.builder()
            .companyId(companyId)
            .storeId(request.storeId())
            .account(account)
            .amount(request.amount())
            .currency("UZS")
            .paymentMethod(request.paymentMethod())
            .incomeCategory(category)
            .sourceType(IncomeSourceType.CLIENT_DEBT_PAYMENT)
            .sourceId(paymentId.toString())
            .customerId(customerId)
            .comment(request.comment() != null ? request.comment() : "Оплата долга клиента")
            .transactionDate(txDate)
            .deleted(false)
            .createdBy(FinanceTenantContext.userId().orElse(null))
            .build();
        Income savedIncome = incomeRepository.save(income);
        String customerName = receivableRepository
            .findByCompanyIdAndCustomerIdOrderByTransactionDateDescCreatedAtDesc(companyId, customerId)
            .stream()
            .map(CustomerReceivableEntry::getCustomerName)
            .filter(n -> n != null && !n.isBlank())
            .findFirst()
            .orElse("Клиент");
        receivableRepository.save(CustomerReceivableEntry.builder()
            .companyId(companyId)
            .customerId(customerId)
            .customerName(customerName)
            .storeId(request.storeId())
            .entryType(LedgerEntryType.PAYMENT)
            .amount(request.amount())
            .incomeId(savedIncome.getId())
            .sourceId("payment:" + paymentId)
            .comment(savedIncome.getComment())
            .transactionDate(txDate)
            .createdBy(FinanceTenantContext.userId().orElse(null))
            .build());
        LogUtil.info(CustomerDebtServiceImpl.class, "Customer debt paid: customer={}, amount={}", customerId, request.amount());
        return mapper.toDto(savedIncome);
    }

    private DebtEntryDto toEntryDto(CustomerReceivableEntry entry) {
        UUID ref = entry.getSaleId() != null ? entry.getSaleId() : entry.getIncomeId();
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
