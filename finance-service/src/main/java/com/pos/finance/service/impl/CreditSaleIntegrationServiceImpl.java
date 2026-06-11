package com.pos.finance.service.impl;

import com.pos.finance.dto.integration.CreditSaleReceivableRequest;
import com.pos.finance.entity.CustomerReceivableEntry;
import com.pos.finance.entity.LedgerEntryType;
import com.pos.finance.repository.CustomerReceivableEntryRepository;
import com.pos.finance.service.CreditSaleIntegrationService;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import com.pos.finance.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class CreditSaleIntegrationServiceImpl implements CreditSaleIntegrationService {

    private final CustomerReceivableEntryRepository receivableRepository;
    private final CompanyBootstrapSupport bootstrapSupport;

    @Override
    public void recordCreditSale(CreditSaleReceivableRequest request) {
        String sourceId = "sale:" + request.saleId();
        if (receivableRepository.findByCompanyIdAndSourceId(request.companyId(), sourceId).isPresent()) {
            LogUtil.info(CreditSaleIntegrationServiceImpl.class, "Credit sale receivable already recorded: sale={}", request.saleId());
            return;
        }
        bootstrapSupport.ensureBootstrapped(request.companyId());
        LocalDate txDate = request.transactionDate() != null ? request.transactionDate() : LocalDate.now();
        receivableRepository.save(CustomerReceivableEntry.builder()
            .companyId(request.companyId())
            .customerId(request.customerId())
            .customerName(request.customerName())
            .storeId(request.storeId())
            .entryType(LedgerEntryType.CHARGE)
            .amount(request.totalAmount())
            .saleId(request.saleId())
            .sourceId(sourceId)
            .comment("Продажа в долг " + request.receiptNumber())
            .transactionDate(txDate)
            .createdBy(request.createdBy())
            .build());
        LogUtil.info(
            CreditSaleIntegrationServiceImpl.class,
            "Credit sale receivable recorded: sale={}, customer={}, amount={}",
            request.saleId(),
            request.customerId(),
            request.totalAmount()
        );
    }
}
