package com.pos.service.finance.impl;

import com.pos.entity.Sale;
import com.pos.service.finance.FinanceSaleIntegrationService;
import com.pos.service.finance.support.FinanceIntegrationPublisher;
import com.pos.service.finance.support.FinanceSalePayloadBuilder;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class FinanceSaleIntegrationServiceImpl implements FinanceSaleIntegrationService {

    private final FinanceIntegrationPublisher financeIntegrationPublisher;

    @Override
    public void onSaleCompleted(Sale sale) {
        Map<String, Object> payload = FinanceSalePayloadBuilder.build(sale);
        if (payload == null) {
            return;
        }
        financeIntegrationPublisher.publishSaleIncomeAfterCommit(payload);
        LogUtil.info(FinanceSaleIntegrationServiceImpl.class, "Finance sale sync scheduled: sale={}", sale.getId());
    }
}
