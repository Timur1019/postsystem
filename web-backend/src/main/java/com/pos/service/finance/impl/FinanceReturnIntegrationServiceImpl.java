package com.pos.service.finance.impl;

import com.pos.entity.Sale;
import com.pos.service.finance.FinanceReturnIntegrationService;
import com.pos.service.finance.support.FinanceIntegrationPublisher;
import com.pos.service.finance.support.FinanceRefundPayloadBuilder;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FinanceReturnIntegrationServiceImpl implements FinanceReturnIntegrationService {

    private final FinanceIntegrationPublisher financeIntegrationPublisher;

    @Override
    public void onRefundCompleted(Sale sale, UUID returnEventId, BigDecimal refundAmount) {
        Map<String, Object> payload = FinanceRefundPayloadBuilder.build(sale, returnEventId, refundAmount);
        if (payload == null) {
            return;
        }
        financeIntegrationPublisher.publishRefundExpenseAfterCommit(payload);
        LogUtil.info(
            FinanceReturnIntegrationServiceImpl.class,
            "Finance refund sync scheduled: sale={}, event={}, amount={}",
            sale.getId(),
            returnEventId,
            refundAmount
        );
    }
}
