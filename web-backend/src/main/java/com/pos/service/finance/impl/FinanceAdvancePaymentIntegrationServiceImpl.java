package com.pos.service.finance.impl;

import com.pos.entity.Sale;
import com.pos.service.finance.FinanceAdvancePaymentIntegrationService;
import com.pos.service.finance.support.FinanceAdvancePaymentPayloadBuilder;
import com.pos.service.finance.support.FinanceIntegrationPublisher;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class FinanceAdvancePaymentIntegrationServiceImpl implements FinanceAdvancePaymentIntegrationService {

    private final FinanceIntegrationPublisher financeIntegrationPublisher;

    @Override
    public void onSaleAdvanceApplied(Sale sale) {
        Map<String, Object> payload = FinanceAdvancePaymentPayloadBuilder.build(sale);
        if (payload == null) {
            return;
        }
        financeIntegrationPublisher.publishAdvancePaymentAfterCommit(payload);
        LogUtil.info(
            FinanceAdvancePaymentIntegrationServiceImpl.class,
            "Finance sale advance payment sync scheduled: sale={}",
            sale.getId()
        );
    }
}
