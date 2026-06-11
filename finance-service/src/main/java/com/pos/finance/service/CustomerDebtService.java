package com.pos.finance.service;

import com.pos.finance.dto.debt.DebtBalanceDto;
import com.pos.finance.dto.debt.DebtEntryDto;
import com.pos.finance.dto.debt.PayCustomerDebtRequest;
import com.pos.finance.dto.income.IncomeDto;

import java.util.List;
import java.util.UUID;

public interface CustomerDebtService {

    List<DebtBalanceDto> listBalances();

    List<DebtEntryDto> listEntries(UUID customerId);

    IncomeDto payDebt(UUID customerId, PayCustomerDebtRequest request);
}
