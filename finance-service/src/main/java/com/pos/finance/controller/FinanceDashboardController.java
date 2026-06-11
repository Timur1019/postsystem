package com.pos.finance.controller;

import com.pos.finance.dto.dashboard.FinanceDashboardDto;
import com.pos.finance.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/finance/dashboard")
@RequiredArgsConstructor
@Tag(name = "Finance Dashboard", description = "Финансовый дашборд")
public class FinanceDashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @Operation(summary = "Финансовый дашборд")
    public ResponseEntity<FinanceDashboardDto> dashboard(
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(dashboardService.getDashboard(storeId, from, to));
    }
}
