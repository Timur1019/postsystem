package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.zreport.ZReportDetailResponse;
import com.pos.dto.zreport.ZReportRowResponse;
import com.pos.service.ZReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import com.pos.spreadsheet.SpreadsheetDownloadSupport;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/z-reports")
@RequiredArgsConstructor
@Tag(name = "Z-Reports", description = "Архив Z-отчётов и экспорт данных")
@StandardApiResponses
public class ZReportController {

    private final ZReportService zReportService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Список Z-отчётов", description = "Постраничный журнал Z-отчётов с фильтрами")
    @ApiResponse(responseCode = "200", description = "Список Z-отчётов")
    public ResponseEntity<PageResponse<ZReportRowResponse>> list(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String fiscalCardId,
        @RequestParam(required = false) String terminalSerial,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate closedFrom,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate closedTo,
        @PageableDefault(size = 14) Pageable pageable
    ) {
        return ResponseEntity.ok(
            zReportService.list(search, fiscalCardId, terminalSerial, storeId, closedFrom, closedTo, pageable)
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Z-отчёт по ID", description = "Детальная информация о Z-отчёте")
    @ApiResponse(responseCode = "200", description = "Данные Z-отчёта")
    public ResponseEntity<ZReportDetailResponse> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(zReportService.getDetail(id));
    }

    @GetMapping(value = "/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Экспорт Z-отчётов", description = "Выгрузка журнала Z-отчётов в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportAll(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String fiscalCardId,
        @RequestParam(required = false) String terminalSerial,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate closedFrom,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate closedTo
    ) {
        byte[] body = zReportService.exportListExcel(search, fiscalCardId, terminalSerial, storeId, closedFrom, closedTo);
        return SpreadsheetDownloadSupport.attachment(body, "z_reports_export.xlsx");
    }

    @GetMapping(value = "/{id}/export-sales")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Экспорт продаж Z-отчёта", description = "Выгрузка продаж конкретного Z-отчёта в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportSales(@PathVariable Long id) {
        byte[] body = zReportService.exportSalesForZReport(id);
        return SpreadsheetDownloadSupport.attachment(body, "z_report_" + id + "_sales.xlsx");
    }

    @PostMapping("/backfill-from-shifts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Восстановить Z-отчёты", description = "Создание Z-отчётов из закрытых смен (backfill)")
    @ApiResponse(responseCode = "200", description = "Количество созданных отчётов")
    public ResponseEntity<java.util.Map<String, Integer>> backfillFromShifts() {
        int created = zReportService.backfillFromClosedShifts();
        return ResponseEntity.ok(java.util.Map.of("created", created));
    }
}
