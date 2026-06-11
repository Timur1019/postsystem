package com.pos.finance.controller;

import com.pos.finance.dto.income.CreateIncomeRequest;
import com.pos.finance.dto.income.IncomeDto;
import com.pos.finance.dto.income.UpdateIncomeRequest;
import com.pos.finance.dto.shared.PageResponse;
import com.pos.finance.entity.PaymentMethod;
import com.pos.finance.service.IncomeService;
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
@RequestMapping("/finance/incomes")
@RequiredArgsConstructor
@Tag(name = "Finance Incomes", description = "Приходы")
public class IncomeController {

    private final IncomeService incomeService;

    @GetMapping
    @Operation(summary = "Список приходов")
    public ResponseEntity<PageResponse<IncomeDto>> list(
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) PaymentMethod paymentMethod,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(incomeService.list(storeId, from, to, paymentMethod, pageable));
    }

    @PostMapping
    @Operation(summary = "Создать приход")
    public ResponseEntity<IncomeDto> create(@Valid @RequestBody CreateIncomeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(incomeService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Изменить приход")
    public ResponseEntity<IncomeDto> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateIncomeRequest request
    ) {
        return ResponseEntity.ok(incomeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить приход (soft delete)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        incomeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
