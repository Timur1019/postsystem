package com.pos.finance.service;

import com.pos.finance.dto.account.CreateFinancialAccountRequest;
import com.pos.finance.dto.account.FinancialAccountDto;
import com.pos.finance.dto.account.UpdateFinancialAccountRequest;

import java.util.List;
import java.util.UUID;

public interface FinancialAccountService {

    List<FinancialAccountDto> list();

    FinancialAccountDto create(CreateFinancialAccountRequest request);

    FinancialAccountDto update(UUID id, UpdateFinancialAccountRequest request);
}
