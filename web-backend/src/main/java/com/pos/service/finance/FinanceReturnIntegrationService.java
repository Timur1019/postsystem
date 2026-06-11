package com.pos.service.finance;

import com.pos.entity.Sale;

import java.math.BigDecimal;
import java.util.UUID;

public interface FinanceReturnIntegrationService {

    void onRefundCompleted(Sale sale, UUID returnEventId, BigDecimal refundAmount);
}
