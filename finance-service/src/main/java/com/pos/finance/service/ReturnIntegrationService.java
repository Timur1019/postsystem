package com.pos.finance.service;

import com.pos.finance.dto.integration.RefundExpenseRequest;

public interface ReturnIntegrationService {

    void recordRefundExpense(RefundExpenseRequest request);
}
