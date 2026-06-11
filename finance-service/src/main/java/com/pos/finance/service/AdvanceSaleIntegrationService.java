package com.pos.finance.service;

import com.pos.finance.dto.integration.AdvanceSaleDepositRequest;

public interface AdvanceSaleIntegrationService {

    void recordAdvanceDeposit(AdvanceSaleDepositRequest request);
}
