package com.pos.finance.service;

import com.pos.finance.dto.expense.CreateExpenseRequest;
import com.pos.finance.dto.expense.ExpenseDto;
import com.pos.finance.dto.expense.UpdateExpenseRequest;
import com.pos.finance.dto.shared.PageResponse;
import com.pos.finance.entity.PaymentMethod;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface ExpenseService {

    PageResponse<ExpenseDto> list(
        Integer storeId, LocalDate from, LocalDate to, UUID categoryId, PaymentMethod paymentMethod, Pageable pageable
    );

    ExpenseDto create(CreateExpenseRequest request);

    ExpenseDto update(UUID id, UpdateExpenseRequest request);

    void delete(UUID id);
}
