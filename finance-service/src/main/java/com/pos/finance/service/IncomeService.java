package com.pos.finance.service;

import com.pos.finance.dto.income.CreateIncomeRequest;
import com.pos.finance.dto.income.IncomeDto;
import com.pos.finance.dto.income.UpdateIncomeRequest;
import com.pos.finance.dto.shared.PageResponse;
import com.pos.finance.entity.PaymentMethod;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface IncomeService {

    PageResponse<IncomeDto> list(Integer storeId, LocalDate from, LocalDate to, PaymentMethod paymentMethod, Pageable pageable);

    IncomeDto create(CreateIncomeRequest request);

    IncomeDto update(UUID id, UpdateIncomeRequest request);

    void delete(UUID id);
}
