package com.pos.finance.controller;

import com.pos.finance.dto.report.CashFlowReportDto;
import com.pos.finance.dto.report.ProfitLossReportDto;
import com.pos.finance.service.FinanceExportService;
import com.pos.finance.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/finance/reports")
@RequiredArgsConstructor
@Tag(name = "Finance Reports", description = "Финансовые отчёты")
public class FinanceReportController {

    private final ReportService reportService;
    private final FinanceExportService exportService;

    @GetMapping("/profit-loss")
    @Operation(summary = "Отчёт прибыль/убыток")
    public ResponseEntity<ProfitLossReportDto> profitLoss(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(reportService.profitLoss(from, to, storeId));
    }

    @GetMapping("/profit-loss/export")
    @Operation(summary = "Экспорт P&L в Excel")
    public ResponseEntity<byte[]> exportProfitLoss(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId
    ) {
        byte[] data = exportService.exportProfitLoss(from, to, storeId);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=profit-loss.xlsx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(data);
    }

    @GetMapping("/cash-flow")
    @Operation(summary = "Отчёт Cash Flow")
    public ResponseEntity<CashFlowReportDto> cashFlow(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(reportService.cashFlow(from, to, storeId));
    }

    @GetMapping("/cash-flow/export")
    @Operation(summary = "Экспорт Cash Flow в Excel")
    public ResponseEntity<byte[]> exportCashFlow(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId
    ) {
        byte[] data = exportService.exportCashFlow(from, to, storeId);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=cash-flow.xlsx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(data);
    }
}
