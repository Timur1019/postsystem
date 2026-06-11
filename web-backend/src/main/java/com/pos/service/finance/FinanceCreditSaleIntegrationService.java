package com.pos.service.finance;

import com.pos.entity.Sale;

public interface FinanceCreditSaleIntegrationService {

    void onCreditSaleCompleted(Sale sale);
}
