package com.pos.controller;

import com.pos.dto.cashier.CashierShiftResponse;
import com.pos.dto.cashier.ShiftReportResponse;
import com.pos.service.cashier.CashierShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/cashier/shifts")
@RequiredArgsConstructor
public class CashierShiftController {

    private final CashierShiftService cashierShiftService;

    @GetMapping("/current")
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<CashierShiftResponse> current(@RequestParam Integer storeId) {
        return ResponseEntity.ok(cashierShiftService.getOrOpenCurrent(storeId));
    }

    @PostMapping("/open")
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<CashierShiftResponse> open(@RequestParam Integer storeId) {
        return ResponseEntity.ok(cashierShiftService.openShift(storeId));
    }

    @GetMapping("/{id}/x-report")
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<ShiftReportResponse> xReport(@PathVariable UUID id) {
        return ResponseEntity.ok(cashierShiftService.buildXReport(id));
    }

    @GetMapping("/{id}/z-report")
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<ShiftReportResponse> zReport(@PathVariable UUID id) {
        return ResponseEntity.ok(cashierShiftService.buildZReportPreview(id));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<CashierShiftResponse> close(@PathVariable UUID id) {
        return ResponseEntity.ok(cashierShiftService.closeShift(id));
    }
}
