package com.pos.service.finance;

import com.pos.entity.Sale;

public interface FinanceAdvanceSaleIntegrationService {

    void onAdvanceSaleCompleted(Sale sale);
}
