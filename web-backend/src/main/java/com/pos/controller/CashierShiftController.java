package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.cashier.CashierShiftResponse;
import com.pos.dto.cashier.FinalizeZReportResponse;
import com.pos.dto.cashier.ShiftReportResponse;
import com.pos.service.cashier.CashierShiftService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Cashier Shifts", description = "Кассовые смены: открытие, закрытие, X/Z-отчёты")
@StandardApiResponses
public class CashierShiftController {

    private final CashierShiftService cashierShiftService;

    @GetMapping("/current")
    @PreAuthorize("hasRole('CASHIER')")
    @Operation(summary = "Текущая смена", description = "Получение активной смены кассира в магазине")
    @ApiResponse(responseCode = "200", description = "Данные текущей смены")
    public ResponseEntity<CashierShiftResponse> current(@RequestParam Integer storeId) {
        return ResponseEntity.ok(cashierShiftService.getCurrent(storeId));
    }

    @PostMapping("/open")
    @PreAuthorize("hasRole('CASHIER')")
    @Operation(summary = "Открыть смену", description = "Открытие новой кассовой смены")
    @ApiResponse(responseCode = "200", description = "Смена открыта")
    public ResponseEntity<CashierShiftResponse> open(@RequestParam Integer storeId) {
        return ResponseEntity.ok(cashierShiftService.openShift(storeId));
    }

    @GetMapping("/{id}/x-report")
    @PreAuthorize("hasRole('CASHIER')")
    @Operation(summary = "X-отчёт", description = "Промежуточный отчёт по смене без закрытия")
    @ApiResponse(responseCode = "200", description = "X-отчёт смены")
    public ResponseEntity<ShiftReportResponse> xReport(@PathVariable UUID id) {
        return ResponseEntity.ok(cashierShiftService.buildXReport(id));
    }

    @GetMapping("/{id}/z-report")
    @PreAuthorize("hasRole('CASHIER')")
    @Operation(summary = "Предпросмотр Z-отчёта", description = "Предварительный Z-отчёт перед закрытием смены")
    @ApiResponse(responseCode = "200", description = "Предпросмотр Z-отчёта")
    public ResponseEntity<ShiftReportResponse> zReportPreview(@PathVariable UUID id) {
        return ResponseEntity.ok(cashierShiftService.buildZReportPreview(id));
    }

    @PostMapping("/{id}/z-report")
    @PreAuthorize("hasRole('CASHIER')")
    @Operation(summary = "Финализировать Z-отчёт", description = "Формирование и сохранение Z-отчёта смены")
    @ApiResponse(responseCode = "200", description = "Z-отчёт сформирован")
    public ResponseEntity<FinalizeZReportResponse> finalizeZReport(@PathVariable UUID id) {
        return ResponseEntity.ok(cashierShiftService.finalizeZReport(id));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('CASHIER')")
    @Operation(summary = "Закрыть смену", description = "Закрытие кассовой смены")
    @ApiResponse(responseCode = "200", description = "Смена закрыта")
    public ResponseEntity<CashierShiftResponse> close(@PathVariable UUID id) {
        return ResponseEntity.ok(cashierShiftService.closeShift(id));
    }
}
