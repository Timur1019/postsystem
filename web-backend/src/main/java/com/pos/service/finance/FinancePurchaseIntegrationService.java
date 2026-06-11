package com.pos.service.finance;

import com.pos.entity.StockReceipt;

public interface FinancePurchaseIntegrationService {

    void onPurchaseCompleted(StockReceipt receipt, String paymentType);
}
