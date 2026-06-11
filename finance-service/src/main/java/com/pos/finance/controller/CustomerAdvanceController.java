package com.pos.finance.controller;

import com.pos.finance.dto.advance.ApplyCustomerAdvanceRequest;
import com.pos.finance.dto.debt.DebtBalanceDto;
import com.pos.finance.dto.debt.DebtEntryDto;
import com.pos.finance.service.CustomerAdvanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/finance/advances/customers")
@RequiredArgsConstructor
@Tag(name = "Customer Advances", description = "Авансы покупателей")
public class CustomerAdvanceController {

    private final CustomerAdvanceService customerAdvanceService;

    @GetMapping
    @Operation(summary = "Балансы авансов клиентов")
    public ResponseEntity<List<DebtBalanceDto>> balances() {
        return ResponseEntity.ok(customerAdvanceService.listBalances());
    }

    @GetMapping("/{customerId}/balance")
    @Operation(summary = "Баланс аванса клиента")
    public ResponseEntity<BigDecimal> balance(@PathVariable UUID customerId) {
        return ResponseEntity.ok(customerAdvanceService.balanceForCustomer(customerId));
    }

    @GetMapping("/{customerId}/entries")
    @Operation(summary = "История аванса клиента")
    public ResponseEntity<List<DebtEntryDto>> entries(@PathVariable UUID customerId) {
        return ResponseEntity.ok(customerAdvanceService.listEntries(customerId));
    }

    @PostMapping("/{customerId}/apply")
    @Operation(summary = "Списать аванс клиента")
    public ResponseEntity<Void> apply(
        @PathVariable UUID customerId,
        @Valid @RequestBody ApplyCustomerAdvanceRequest request
    ) {
        customerAdvanceService.applyAdvance(customerId, request);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
