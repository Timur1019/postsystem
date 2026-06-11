package com.pos.finance.service.impl;

import com.pos.finance.dto.shared.PageResponse;
import com.pos.finance.dto.transfer.AccountTransferDto;
import com.pos.finance.dto.transfer.CreateAccountTransferRequest;
import com.pos.finance.entity.AccountTransfer;
import com.pos.finance.entity.FinanceAuditAction;
import com.pos.finance.entity.FinanceAuditEntityType;
import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.exception.FinanceExceptions;
import com.pos.finance.mapper.FinanceMapper;
import com.pos.finance.repository.AccountTransferRepository;
import com.pos.finance.security.FinanceTenantContext;
import com.pos.finance.service.AccountTransferService;
import com.pos.finance.service.support.AccountBalanceSupport;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import com.pos.finance.service.support.FinanceAuditSupport;
import com.pos.finance.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountTransferServiceImpl implements AccountTransferService {

    private final AccountTransferRepository transferRepository;
    private final AccountBalanceSupport balanceSupport;
    private final CompanyBootstrapSupport bootstrapSupport;
    private final FinanceMapper mapper;
    private final FinanceAuditSupport auditSupport;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AccountTransferDto> list(Integer storeId, LocalDate from, LocalDate to, Pageable pageable) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        return PageResponse.from(
            transferRepository.search(companyId, storeId, from, to, pageable).map(mapper::toDto)
        );
    }

    @Override
    public AccountTransferDto create(CreateAccountTransferRequest request) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        if (request.fromAccountId().equals(request.toAccountId())) {
            throw FinanceExceptions.badRequest("Нельзя переводить на тот же счёт");
        }
        FinancialAccount from = balanceSupport.requireAccount(request.fromAccountId(), companyId);
        FinancialAccount to = balanceSupport.requireAccount(request.toAccountId(), companyId);
        if (!from.isActive() || !to.isActive()) {
            throw FinanceExceptions.badRequest("Счёт неактивен");
        }
        LocalDate txDate = request.transactionDate() != null ? request.transactionDate() : LocalDate.now();
        balanceSupport.debit(from, request.amount());
        balanceSupport.credit(to, request.amount());
        AccountTransfer saved = transferRepository.save(AccountTransfer.builder()
            .companyId(companyId)
            .storeId(request.storeId())
            .fromAccountId(from.getId())
            .fromAccountName(from.getName())
            .toAccountId(to.getId())
            .toAccountName(to.getName())
            .amount(request.amount())
            .currency(from.getCurrency() != null ? from.getCurrency() : "UZS")
            .comment(request.comment())
            .transactionDate(txDate)
            .createdBy(FinanceTenantContext.userId().orElse(null))
            .build());
        auditSupport.log(
            FinanceAuditAction.CREATE,
            FinanceAuditEntityType.TRANSFER,
            saved.getId(),
            "Перевод " + from.getName() + " → " + to.getName() + ": " + request.amount(),
            null
        );
        LogUtil.info(
            AccountTransferServiceImpl.class,
            "Account transfer: {} -> {}, amount={}",
            from.getId(),
            to.getId(),
            request.amount()
        );
        return mapper.toDto(saved);
    }
}
