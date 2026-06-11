package com.pos.finance.controller;

import com.pos.finance.dto.debt.DebtBalanceDto;
import com.pos.finance.dto.debt.DebtEntryDto;
import com.pos.finance.dto.debt.PaySupplierDebtRequest;
import com.pos.finance.dto.expense.ExpenseDto;
import com.pos.finance.service.SupplierDebtService;
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
@RequestMapping("/finance/debts/suppliers")
@RequiredArgsConstructor
@Tag(name = "Supplier Debts", description = "Долги поставщикам")
public class SupplierDebtController {

    private final SupplierDebtService supplierDebtService;

    @GetMapping
    @Operation(summary = "Балансы долгов поставщикам")
    public ResponseEntity<List<DebtBalanceDto>> balances() {
        return ResponseEntity.ok(supplierDebtService.listBalances());
    }

    @GetMapping("/{supplierId}/entries")
    @Operation(summary = "История долга поставщику")
    public ResponseEntity<List<DebtEntryDto>> entries(@PathVariable UUID supplierId) {
        return ResponseEntity.ok(supplierDebtService.listEntries(supplierId));
    }

    @PostMapping("/{supplierId}/pay")
    @Operation(summary = "Погасить долг поставщику")
    public ResponseEntity<ExpenseDto> pay(
        @PathVariable UUID supplierId,
        @Valid @RequestBody PaySupplierDebtRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierDebtService.payDebt(supplierId, request));
    }
}
