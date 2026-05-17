package com.pos.controller;

import com.pos.dto.shared.PageResponse;
import com.pos.dto.zreport.ZReportDetailResponse;
import com.pos.dto.zreport.ZReportRowResponse;
import com.pos.service.ZReportService;
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
public class ZReportController {

    private final ZReportService zReportService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
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
    public ResponseEntity<ZReportDetailResponse> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(zReportService.getDetail(id));
    }

    @GetMapping(value = "/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
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
    public ResponseEntity<byte[]> exportSales(@PathVariable Long id) {
        byte[] body = zReportService.exportSalesForZReport(id);
        return SpreadsheetDownloadSupport.attachment(body, "z_report_" + id + "_sales.xlsx");
    }

    @PostMapping("/backfill-from-shifts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<java.util.Map<String, Integer>> backfillFromShifts() {
        int created = zReportService.backfillFromClosedShifts();
        return ResponseEntity.ok(java.util.Map.of("created", created));
    }
}
