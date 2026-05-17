package com.pos.controller;

import com.pos.dto.cashregister.CashRegisterConfigFormOptionsResponse;
import com.pos.dto.cashregister.CashRegisterConfigRowResponse;
import com.pos.dto.cashregister.CreateCashRegisterConfigRequest;
import com.pos.dto.shared.PageResponse;
import com.pos.service.CashRegisterConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cash-register-configs")
@RequiredArgsConstructor
public class CashRegisterConfigController {

    private final CashRegisterConfigService cashRegisterConfigService;

    @GetMapping("/form-options")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CashRegisterConfigFormOptionsResponse> formOptions() {
        return ResponseEntity.ok(cashRegisterConfigService.getFormOptions());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PageResponse<CashRegisterConfigRowResponse>> list(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) String equipmentSerial,
        @PageableDefault(size = 14) Pageable pageable
    ) {
        return ResponseEntity.ok(
            cashRegisterConfigService.list(search, storeId, equipmentSerial, pageable)
        );
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CashRegisterConfigRowResponse> create(@Valid @RequestBody CreateCashRegisterConfigRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cashRegisterConfigService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CashRegisterConfigRowResponse> update(
        @PathVariable Long id,
        @Valid @RequestBody CreateCashRegisterConfigRequest request
    ) {
        return ResponseEntity.ok(cashRegisterConfigService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        cashRegisterConfigService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
