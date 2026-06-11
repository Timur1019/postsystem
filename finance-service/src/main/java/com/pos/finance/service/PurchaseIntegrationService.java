package com.pos.finance.service;

import com.pos.finance.dto.integration.PurchaseExpenseRequest;

public interface PurchaseIntegrationService {

    void recordPurchaseExpense(PurchaseExpenseRequest request);
}
