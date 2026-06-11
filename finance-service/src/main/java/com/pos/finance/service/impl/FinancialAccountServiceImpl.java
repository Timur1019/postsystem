package com.pos.finance.service.impl;

import com.pos.finance.dto.account.CreateFinancialAccountRequest;
import com.pos.finance.dto.account.FinancialAccountDto;
import com.pos.finance.dto.account.UpdateFinancialAccountRequest;
import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.exception.FinanceExceptions;
import com.pos.finance.mapper.FinanceMapper;
import com.pos.finance.repository.FinancialAccountRepository;
import com.pos.finance.security.FinanceTenantContext;
import com.pos.finance.service.FinancialAccountService;
import com.pos.finance.service.support.AccountBalanceSupport;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import com.pos.finance.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class FinancialAccountServiceImpl implements FinancialAccountService {

    private final FinancialAccountRepository accountRepository;
    private final FinanceMapper mapper;
    private final CompanyBootstrapSupport bootstrapSupport;
    private final AccountBalanceSupport balanceSupport;

    @Override
    @Transactional(readOnly = true)
    public List<FinancialAccountDto> list() {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        return accountRepository.findByCompanyIdAndDeletedFalseOrderByNameAsc(companyId).stream()
            .map(mapper::toDto)
            .toList();
    }

    @Override
    public FinancialAccountDto create(CreateFinancialAccountRequest request) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        BigDecimal initial = request.initialBalance() != null ? request.initialBalance() : BigDecimal.ZERO;
        FinancialAccount account = FinancialAccount.builder()
            .companyId(companyId)
            .storeId(request.storeId())
            .name(request.name().trim())
            .type(request.type())
            .balance(initial)
            .currency(request.currency() != null ? request.currency() : "UZS")
            .active(true)
            .deleted(false)
            .createdBy(FinanceTenantContext.userId().orElse(null))
            .build();
        FinancialAccount saved = accountRepository.save(account);
        LogUtil.info(FinancialAccountServiceImpl.class, "Account created: id={}, name={}", saved.getId(), saved.getName());
        return mapper.toDto(saved);
    }

    @Override
    public FinancialAccountDto update(UUID id, UpdateFinancialAccountRequest request) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        FinancialAccount account = balanceSupport.requireAccount(id, companyId);
        account.setName(request.name().trim());
        if (request.type() != null) {
            account.setType(request.type());
        }
        if (request.storeId() != null) {
            account.setStoreId(request.storeId());
        }
        if (request.active() != null) {
            account.setActive(request.active());
        }
        if (request.balanceAdjustment() != null && request.balanceAdjustment().signum() != 0) {
            account.setBalance(account.getBalance().add(request.balanceAdjustment()));
            LogUtil.info(FinancialAccountServiceImpl.class, "Balance adjusted: account={}, delta={}, comment={}",
                id, request.balanceAdjustment(), request.adjustmentComment());
        }
        return mapper.toDto(accountRepository.save(account));
    }
}
