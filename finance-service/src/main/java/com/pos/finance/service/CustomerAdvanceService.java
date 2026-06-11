package com.pos.finance.service;

import com.pos.finance.dto.advance.ApplyCustomerAdvanceRequest;
import com.pos.finance.dto.debt.DebtBalanceDto;
import com.pos.finance.dto.debt.DebtEntryDto;
import com.pos.finance.dto.integration.SaleAdvanceApplyRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface CustomerAdvanceService {

    List<DebtBalanceDto> listBalances();

    BigDecimal balanceForCustomer(UUID customerId);

    List<DebtEntryDto> listEntries(UUID customerId);

    void applyAdvance(UUID customerId, ApplyCustomerAdvanceRequest request);

    void applyAdvanceFromSale(SaleAdvanceApplyRequest request);
}
