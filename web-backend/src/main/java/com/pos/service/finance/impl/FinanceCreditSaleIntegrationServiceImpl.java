package com.pos.service.finance.impl;

import com.pos.entity.Sale;
import com.pos.service.finance.FinanceCreditSaleIntegrationService;
import com.pos.service.finance.support.FinanceCreditSalePayloadBuilder;
import com.pos.service.finance.support.FinanceIntegrationPublisher;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class FinanceCreditSaleIntegrationServiceImpl implements FinanceCreditSaleIntegrationService {

    private final FinanceIntegrationPublisher financeIntegrationPublisher;

    @Override
    public void onCreditSaleCompleted(Sale sale) {
        Map<String, Object> payload = FinanceCreditSalePayloadBuilder.build(sale);
        if (payload == null) {
            return;
        }
        financeIntegrationPublisher.publishCreditSaleAfterCommit(payload);
        LogUtil.info(FinanceCreditSaleIntegrationServiceImpl.class, "Finance credit sale sync scheduled: sale={}", sale.getId());
    }
}
