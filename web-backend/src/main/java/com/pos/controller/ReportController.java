package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.report.DailySummaryResponse;
import com.pos.dto.report.SalesReportResponse;
import com.pos.dto.report.sales.PeriodCompareResponse;
import com.pos.service.ReportService;
import com.pos.service.cache.PosCacheRefreshOrchestrator;
import com.pos.service.export.ReportExportService;
import com.pos.spreadsheet.SpreadsheetDownloadSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Reports (general)", description = "Общие отчёты: дневная сводка, продажи, топ товаров")
@StandardApiResponses
public class ReportController {

    private final ReportService reportService;
    private final ReportExportService reportExportService;
    private final PosCacheRefreshOrchestrator posCacheRefreshOrchestrator;

    @GetMapping("/daily")
    @Operation(summary = "Дневная сводка", description = "Сводка продаж и показателей за день")
    @ApiResponse(responseCode = "200", description = "Дневная сводка")
    public ResponseEntity<DailySummaryResponse> dailySummary(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate reportDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(reportService.getDailySummary(reportDate));
    }

    @GetMapping(value = "/daily/export")
    @Operation(summary = "Экспорт дневной сводки", description = "Выгрузка дневной сводки в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportDaily(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return SpreadsheetDownloadSupport.attachment(
            reportExportService.exportDailySummary(date),
            "daily_summary_export.xlsx"
        );
    }

    @GetMapping("/sales")
    @Operation(summary = "Отчёт по продажам", description = "Агрегированный отчёт продаж за период")
    @ApiResponse(responseCode = "200", description = "Отчёт по продажам")
    public ResponseEntity<SalesReportResponse> salesReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(reportService.getSalesReport(from, to));
    }

    @GetMapping("/top-products")
    @Operation(summary = "Топ товаров", description = "Рейтинг самых продаваемых товаров за период")
    @ApiResponse(responseCode = "200", description = "Топ товаров")
    public ResponseEntity<?> topProducts(
        @RequestParam(defaultValue = "10") int limit,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(reportService.getTopProducts(limit, from, to));
    }

    @GetMapping("/cashier-performance")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Эффективность кассиров", description = "Отчёт по показателям работы кассиров")
    @ApiResponse(responseCode = "200", description = "Отчёт по кассирам")
    public ResponseEntity<?> cashierPerformance(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(reportService.getCashierPerformance(from, to));
    }

    @GetMapping(value = "/cashier-performance/export")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Экспорт эффективности кассиров", description = "Выгрузка отчёта по кассирам в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
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
    @Operation(summary = "Сравнение периодов", description = "Сравнение показателей продаж между периодами")
    @ApiResponse(responseCode = "200", description = "Сравнение периодов")
    public ResponseEntity<PeriodCompareResponse> periodCompare(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(reportService.getPeriodCompare(from, to, storeId));
    }

    @GetMapping(value = "/sales/period-compare/export")
    @Operation(summary = "Экспорт сравнения периодов", description = "Выгрузка сравнения периодов в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
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
    @Operation(summary = "Обновить кэш", description = "Принудительное обновление кэшей POS-данных")
    @ApiResponse(responseCode = "204", description = "Кэш обновлён")
    public ResponseEntity<Void> refreshCaches() {
        posCacheRefreshOrchestrator.refreshAll();
        return ResponseEntity.noContent().build();
    }
}
