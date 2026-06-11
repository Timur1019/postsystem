package com.pos.service.finance.impl;

import com.pos.entity.StockReceipt;
import com.pos.service.finance.FinancePurchaseIntegrationService;
import com.pos.service.finance.support.FinanceCreditPurchasePayloadBuilder;
import com.pos.service.finance.support.FinanceIntegrationPublisher;
import com.pos.service.finance.support.FinancePurchasePayloadBuilder;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class FinancePurchaseIntegrationServiceImpl implements FinancePurchaseIntegrationService {

    private final FinanceIntegrationPublisher financeIntegrationPublisher;

    @Override
    public void onPurchaseCompleted(StockReceipt receipt, String paymentType) {
        String normalized = paymentType != null ? paymentType.toUpperCase() : "CASH";
        if ("CREDIT".equals(normalized)) {
            Map<String, Object> creditPayload = FinanceCreditPurchasePayloadBuilder.build(receipt);
            if (creditPayload == null) {
                LogUtil.warn(FinancePurchaseIntegrationServiceImpl.class, "Credit purchase sync skipped: receipt={}", receipt.getId());
                return;
            }
            financeIntegrationPublisher.publishCreditPurchaseAfterCommit(creditPayload);
            LogUtil.info(FinancePurchaseIntegrationServiceImpl.class, "Finance credit purchase sync scheduled: receipt={}", receipt.getId());
            return;
        }
        Map<String, Object> payload = FinancePurchasePayloadBuilder.build(receipt, normalized);
        if (payload == null) {
            return;
        }
        financeIntegrationPublisher.publishPurchaseExpenseAfterCommit(payload);
        LogUtil.info(FinancePurchaseIntegrationServiceImpl.class, "Finance purchase sync scheduled: receipt={}", receipt.getId());
    }
}
