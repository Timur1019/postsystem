package com.pos.finance.service;

import com.pos.finance.dto.integration.CreditPurchasePayableRequest;

public interface CreditPurchaseIntegrationService {

    void recordCreditPurchase(CreditPurchasePayableRequest request);
}
