package com.pos.finance.service.impl;

import com.pos.finance.dto.integration.AdvanceSaleDepositRequest;
import com.pos.finance.entity.AdvanceEntryType;
import com.pos.finance.entity.CustomerAdvanceEntry;
import com.pos.finance.repository.CustomerAdvanceEntryRepository;
import com.pos.finance.service.AdvanceSaleIntegrationService;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import com.pos.finance.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class AdvanceSaleIntegrationServiceImpl implements AdvanceSaleIntegrationService {

    private final CustomerAdvanceEntryRepository advanceRepository;
    private final CompanyBootstrapSupport bootstrapSupport;

    @Override
    public void recordAdvanceDeposit(AdvanceSaleDepositRequest request) {
        String sourceId = "advance-sale:" + request.saleId();
        if (advanceRepository.findByCompanyIdAndSourceId(request.companyId(), sourceId).isPresent()) {
            LogUtil.info(
                AdvanceSaleIntegrationServiceImpl.class,
                "Advance deposit already recorded: sale={}",
                request.saleId()
            );
            return;
        }
        bootstrapSupport.ensureBootstrapped(request.companyId());
        LocalDate txDate = request.transactionDate() != null ? request.transactionDate() : LocalDate.now();
        advanceRepository.save(CustomerAdvanceEntry.builder()
            .companyId(request.companyId())
            .customerId(request.customerId())
            .customerName(request.customerName())
            .storeId(request.storeId())
            .entryType(AdvanceEntryType.DEPOSIT)
            .amount(request.totalAmount())
            .saleId(request.saleId())
            .sourceId(sourceId)
            .comment("Аванс " + request.receiptNumber())
            .transactionDate(txDate)
            .createdBy(request.createdBy())
            .build());
        LogUtil.info(
            AdvanceSaleIntegrationServiceImpl.class,
            "Advance deposit recorded: sale={}, customer={}, amount={}",
            request.saleId(),
            request.customerId(),
            request.totalAmount()
        );
    }
}
