package com.pos.finance.service;

import com.pos.finance.dto.debt.DebtBalanceDto;
import com.pos.finance.dto.debt.DebtEntryDto;
import com.pos.finance.dto.debt.PaySupplierDebtRequest;
import com.pos.finance.dto.expense.ExpenseDto;

import java.util.List;
import java.util.UUID;

public interface SupplierDebtService {

    List<DebtBalanceDto> listBalances();

    List<DebtEntryDto> listEntries(UUID supplierId);

    ExpenseDto payDebt(UUID supplierId, PaySupplierDebtRequest request);
}
