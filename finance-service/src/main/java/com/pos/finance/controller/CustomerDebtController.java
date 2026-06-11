package com.pos.finance.controller;

import com.pos.finance.dto.debt.DebtBalanceDto;
import com.pos.finance.dto.debt.DebtEntryDto;
import com.pos.finance.dto.debt.PayCustomerDebtRequest;
import com.pos.finance.dto.income.IncomeDto;
import com.pos.finance.service.CustomerDebtService;
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
@RequestMapping("/finance/debts/customers")
@RequiredArgsConstructor
@Tag(name = "Customer Debts", description = "Долги клиентов")
public class CustomerDebtController {

    private final CustomerDebtService customerDebtService;

    @GetMapping
    @Operation(summary = "Балансы долгов клиентов")
    public ResponseEntity<List<DebtBalanceDto>> balances() {
        return ResponseEntity.ok(customerDebtService.listBalances());
    }

    @GetMapping("/{customerId}/entries")
    @Operation(summary = "История долга клиента")
    public ResponseEntity<List<DebtEntryDto>> entries(@PathVariable UUID customerId) {
        return ResponseEntity.ok(customerDebtService.listEntries(customerId));
    }

    @PostMapping("/{customerId}/pay")
    @Operation(summary = "Погасить долг клиента")
    public ResponseEntity<IncomeDto> pay(
        @PathVariable UUID customerId,
        @Valid @RequestBody PayCustomerDebtRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerDebtService.payDebt(customerId, request));
    }
}
