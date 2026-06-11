package com.pos.service.finance.impl;

import com.pos.entity.Sale;
import com.pos.service.finance.FinanceAdvanceSaleIntegrationService;
import com.pos.service.finance.support.FinanceAdvanceSalePayloadBuilder;
import com.pos.service.finance.support.FinanceIntegrationPublisher;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class FinanceAdvanceSaleIntegrationServiceImpl implements FinanceAdvanceSaleIntegrationService {

    private final FinanceIntegrationPublisher financeIntegrationPublisher;

    @Override
    public void onAdvanceSaleCompleted(Sale sale) {
        Map<String, Object> payload = FinanceAdvanceSalePayloadBuilder.build(sale);
        if (payload == null) {
            return;
        }
        financeIntegrationPublisher.publishAdvanceSaleAfterCommit(payload);
        LogUtil.info(FinanceAdvanceSaleIntegrationServiceImpl.class, "Finance advance sale sync scheduled: sale={}", sale.getId());
    }
}
