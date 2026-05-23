package com.pos.controller;

import com.pos.dto.report.DailySummaryResponse;
import com.pos.dto.report.SalesReportResponse;
import com.pos.dto.report.sales.PeriodCompareResponse;
import com.pos.service.ReportService;
import com.pos.service.cache.PosCacheRefreshOrchestrator;
import com.pos.service.export.ReportExportService;
import com.pos.spreadsheet.SpreadsheetDownloadSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ReportController {

    private final ReportService reportService;
    private final ReportExportService reportExportService;
    private final PosCacheRefreshOrchestrator posCacheRefreshOrchestrator;

    @GetMapping("/daily")
    public ResponseEntity<DailySummaryResponse> dailySummary(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate reportDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(reportService.getDailySummary(reportDate));
    }

    @GetMapping(value = "/daily/export")
    public ResponseEntity<byte[]> exportDaily(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return SpreadsheetDownloadSupport.attachment(
            reportExportService.exportDailySummary(date),
            "daily_summary_export.xlsx"
        );
    }

    @GetMapping("/sales")
    public ResponseEntity<SalesReportResponse> salesReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(reportService.getSalesReport(from, to));
    }

    @GetMapping("/top-products")
    public ResponseEntity<?> topProducts(
        @RequestParam(defaultValue = "10") int limit,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(reportService.getTopProducts(limit, from, to));
    }

    @GetMapping("/cashier-performance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cashierPerformance(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(reportService.getCashierPerformance(from, to));
    }

    @GetMapping(value = "/cashier-performance/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportCashierPerformance(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return SpreadsheetDownloadSupport.attachment(
            reportExportService.exportCashierPerformance(from, to),
            "cashier_performance_export.xlsx"
        );
    }

    @GetMapping("/sales/period-compare")
    public ResponseEntity<PeriodCompareResponse> periodCompare(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(reportService.getPeriodCompare(from, to, storeId));
    }

    @GetMapping(value = "/sales/period-compare/export")
    public ResponseEntity<byte[]> exportPeriodCompare(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId
    ) {
        return SpreadsheetDownloadSupport.attachment(
            reportExportService.exportPeriodCompare(from, to, storeId),
            "period_compare_export.xlsx"
        );
    }

    @PostMapping("/cache/refresh")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> refreshCaches() {
        posCacheRefreshOrchestrator.refreshAll();
        return ResponseEntity.noContent().build();
    }
}
