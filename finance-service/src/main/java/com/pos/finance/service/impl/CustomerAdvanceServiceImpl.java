package com.pos.finance.service.impl;

import com.pos.finance.dto.advance.ApplyCustomerAdvanceRequest;
import com.pos.finance.dto.debt.DebtBalanceDto;
import com.pos.finance.dto.debt.DebtEntryDto;
import com.pos.finance.dto.integration.SaleAdvanceApplyRequest;
import com.pos.finance.entity.AdvanceEntryType;
import com.pos.finance.entity.CustomerAdvanceEntry;
import com.pos.finance.exception.FinanceExceptions;
import com.pos.finance.repository.CustomerAdvanceEntryRepository;
import com.pos.finance.security.FinanceTenantContext;
import com.pos.finance.service.CustomerAdvanceService;
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
public class CustomerAdvanceServiceImpl implements CustomerAdvanceService {

    private final CustomerAdvanceEntryRepository advanceRepository;
    private final CompanyBootstrapSupport bootstrapSupport;

    @Override
    @Transactional(readOnly = true)
    public List<DebtBalanceDto> listBalances() {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        return advanceRepository.sumBalancesByCustomer(companyId).stream()
            .map(row -> new DebtBalanceDto((UUID) row[0], (String) row[1], (BigDecimal) row[2]))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal balanceForCustomer(UUID customerId) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        return advanceRepository.balanceForCustomer(companyId, customerId, AdvanceEntryType.DEPOSIT);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DebtEntryDto> listEntries(UUID customerId) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        return advanceRepository
            .findByCompanyIdAndCustomerIdOrderByTransactionDateDescCreatedAtDesc(companyId, customerId)
            .stream()
            .map(this::toEntryDto)
            .toList();
    }

    @Override
    public void applyAdvance(UUID customerId, ApplyCustomerAdvanceRequest request) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        BigDecimal balance = advanceRepository.balanceForCustomer(companyId, customerId, AdvanceEntryType.DEPOSIT);
        if (request.amount().compareTo(balance) > 0) {
            throw FinanceExceptions.badRequest("Сумма списания больше аванса клиента");
        }
        String customerName = advanceRepository
            .findByCompanyIdAndCustomerIdOrderByTransactionDateDescCreatedAtDesc(companyId, customerId)
            .stream()
            .map(CustomerAdvanceEntry::getCustomerName)
            .filter(n -> n != null && !n.isBlank())
            .findFirst()
            .orElse("Клиент");
        LocalDate txDate = request.transactionDate() != null ? request.transactionDate() : LocalDate.now();
        UUID applyId = UUID.randomUUID();
        advanceRepository.save(CustomerAdvanceEntry.builder()
            .companyId(companyId)
            .customerId(customerId)
            .customerName(customerName)
            .storeId(request.storeId())
            .entryType(AdvanceEntryType.APPLIED)
            .amount(request.amount())
            .sourceId("apply:" + applyId)
            .comment(request.comment() != null ? request.comment() : "Списание аванса")
            .transactionDate(txDate)
            .createdBy(FinanceTenantContext.userId().orElse(null))
            .build());
        LogUtil.info(CustomerAdvanceServiceImpl.class, "Customer advance applied: customer={}, amount={}", customerId, request.amount());
    }

    @Override
    public void applyAdvanceFromSale(SaleAdvanceApplyRequest request) {
        String sourceId = "sale-apply:" + request.saleId();
        if (advanceRepository.findByCompanyIdAndSourceId(request.companyId(), sourceId).isPresent()) {
            LogUtil.info(CustomerAdvanceServiceImpl.class, "Sale advance apply already recorded: sale={}", request.saleId());
            return;
        }
        bootstrapSupport.ensureBootstrapped(request.companyId());
        BigDecimal balance = advanceRepository.balanceForCustomer(
            request.companyId(),
            request.customerId(),
            AdvanceEntryType.DEPOSIT
        );
        if (request.amount().compareTo(balance) > 0) {
            throw FinanceExceptions.badRequest("Сумма списания больше аванса клиента");
        }
        LocalDate txDate = request.transactionDate() != null ? request.transactionDate() : LocalDate.now();
        String customerName = request.customerName() != null && !request.customerName().isBlank()
            ? request.customerName()
            : "Клиент";
        advanceRepository.save(CustomerAdvanceEntry.builder()
            .companyId(request.companyId())
            .customerId(request.customerId())
            .customerName(customerName)
            .storeId(request.storeId())
            .entryType(AdvanceEntryType.APPLIED)
            .amount(request.amount())
            .saleId(request.saleId())
            .sourceId(sourceId)
            .comment("Оплата продажи " + request.receiptNumber())
            .transactionDate(txDate)
            .createdBy(request.createdBy())
            .build());
        LogUtil.info(
            CustomerAdvanceServiceImpl.class,
            "Sale advance applied: sale={}, customer={}, amount={}",
            request.saleId(),
            request.customerId(),
            request.amount()
        );
    }

    private DebtEntryDto toEntryDto(CustomerAdvanceEntry entry) {
        UUID ref = entry.getSaleId() != null ? entry.getSaleId() : entry.getIncomeId();
        return new DebtEntryDto(
            entry.getId(),
            entry.getEntryType() == AdvanceEntryType.DEPOSIT ? com.pos.finance.entity.LedgerEntryType.CHARGE : com.pos.finance.entity.LedgerEntryType.PAYMENT,
            entry.getAmount(),
            entry.getComment(),
            entry.getTransactionDate(),
            ref
        );
    }
}
