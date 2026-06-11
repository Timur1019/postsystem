package com.pos.finance.controller;

import com.pos.finance.dto.expense.CreateExpenseRequest;
import com.pos.finance.dto.expense.ExpenseDto;
import com.pos.finance.dto.expense.UpdateExpenseRequest;
import com.pos.finance.dto.shared.PageResponse;
import com.pos.finance.entity.PaymentMethod;
import com.pos.finance.service.ExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/finance/expenses")
@RequiredArgsConstructor
@Tag(name = "Finance Expenses", description = "Расходы")
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    @Operation(summary = "Список расходов")
    public ResponseEntity<PageResponse<ExpenseDto>> list(
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) UUID categoryId,
        @RequestParam(required = false) PaymentMethod paymentMethod,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(expenseService.list(storeId, from, to, categoryId, paymentMethod, pageable));
    }

    @PostMapping
    @Operation(summary = "Создать расход")
    public ResponseEntity<ExpenseDto> create(@Valid @RequestBody CreateExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(expenseService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Изменить расход")
    public ResponseEntity<ExpenseDto> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateExpenseRequest request
    ) {
        return ResponseEntity.ok(expenseService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить расход (soft delete)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        expenseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
