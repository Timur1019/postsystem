package com.pos.finance.service.impl;

import com.pos.finance.dto.integration.CreditPurchasePayableRequest;
import com.pos.finance.entity.LedgerEntryType;
import com.pos.finance.entity.SupplierPayableEntry;
import com.pos.finance.repository.SupplierPayableEntryRepository;
import com.pos.finance.service.CreditPurchaseIntegrationService;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import com.pos.finance.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class CreditPurchaseIntegrationServiceImpl implements CreditPurchaseIntegrationService {

    private final SupplierPayableEntryRepository payableRepository;
    private final CompanyBootstrapSupport bootstrapSupport;

    @Override
    public void recordCreditPurchase(CreditPurchasePayableRequest request) {
        String sourceId = "purchase:" + request.receiptId();
        if (payableRepository.findByCompanyIdAndSourceId(request.companyId(), sourceId).isPresent()) {
            LogUtil.info(CreditPurchaseIntegrationServiceImpl.class, "Credit purchase payable already recorded: receipt={}", request.receiptId());
            return;
        }
        bootstrapSupport.ensureBootstrapped(request.companyId());
        LocalDate txDate = request.transactionDate() != null ? request.transactionDate() : LocalDate.now();
        payableRepository.save(SupplierPayableEntry.builder()
            .companyId(request.companyId())
            .supplierId(request.supplierId())
            .supplierName(request.supplierName())
            .storeId(request.storeId())
            .entryType(LedgerEntryType.CHARGE)
            .amount(request.totalAmount())
            .receiptId(request.receiptId())
            .sourceId(sourceId)
            .comment("Закуп в долг " + request.receiptNumber())
            .transactionDate(txDate)
            .createdBy(request.createdBy())
            .build());
        LogUtil.info(
            CreditPurchaseIntegrationServiceImpl.class,
            "Credit purchase payable recorded: receipt={}, supplier={}, amount={}",
            request.receiptId(),
            request.supplierId(),
            request.totalAmount()
        );
    }
}
