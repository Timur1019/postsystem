package com.pos.finance.controller;

import com.pos.finance.dto.account.CreateFinancialAccountRequest;
import com.pos.finance.dto.account.FinancialAccountDto;
import com.pos.finance.dto.account.UpdateFinancialAccountRequest;
import com.pos.finance.service.FinancialAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/finance/accounts")
@RequiredArgsConstructor
@Tag(name = "Finance Accounts", description = "Кассы и счета")
public class FinancialAccountController {

    private final FinancialAccountService accountService;

    @GetMapping
    @Operation(summary = "Список счетов")
    public ResponseEntity<List<FinancialAccountDto>> list() {
        return ResponseEntity.ok(accountService.list());
    }

    @PostMapping
    @Operation(summary = "Создать счёт")
    public ResponseEntity<FinancialAccountDto> create(@Valid @RequestBody CreateFinancialAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(accountService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить счёт")
    public ResponseEntity<FinancialAccountDto> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateFinancialAccountRequest request
    ) {
        return ResponseEntity.ok(accountService.update(id, request));
    }
}
