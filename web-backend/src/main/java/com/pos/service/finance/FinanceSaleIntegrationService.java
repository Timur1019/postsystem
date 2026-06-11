package com.pos.service.finance;

import com.pos.entity.Sale;

public interface FinanceSaleIntegrationService {

    void onSaleCompleted(Sale sale);
}
