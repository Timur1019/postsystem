package com.pos.finance.service;

import com.pos.finance.dto.integration.CreditSaleReceivableRequest;

public interface CreditSaleIntegrationService {

    void recordCreditSale(CreditSaleReceivableRequest request);
}
