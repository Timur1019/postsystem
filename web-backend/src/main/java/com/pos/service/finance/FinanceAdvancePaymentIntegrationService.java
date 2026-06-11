package com.pos.service.finance;

import com.pos.entity.Sale;

public interface FinanceAdvancePaymentIntegrationService {

    void onSaleAdvanceApplied(Sale sale);
}
