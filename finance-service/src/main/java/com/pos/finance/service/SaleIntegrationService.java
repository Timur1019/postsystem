package com.pos.finance.service;

import com.pos.finance.dto.integration.SaleIncomeRequest;

public interface SaleIntegrationService {

    void recordSaleIncome(SaleIncomeRequest request);
}
