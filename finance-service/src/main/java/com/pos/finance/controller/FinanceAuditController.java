package com.pos.finance.controller;

import com.pos.finance.dto.audit.FinanceAuditLogDto;
import com.pos.finance.dto.shared.PageResponse;
import com.pos.finance.entity.FinanceAuditEntityType;
import com.pos.finance.service.FinanceAuditService;
import com.pos.finance.service.FinanceExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/finance/audit")
@RequiredArgsConstructor
@Tag(name = "Finance Audit", description = "Журнал изменений финансов")
public class FinanceAuditController {

    private final FinanceAuditService auditService;
    private final FinanceExportService exportService;

    @GetMapping("/logs")
    @Operation(summary = "Журнал финансовых операций")
    public ResponseEntity<PageResponse<FinanceAuditLogDto>> logs(
        @RequestParam(required = false) FinanceAuditEntityType entityType,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @PageableDefault(size = 50) Pageable pageable
    ) {
        return ResponseEntity.ok(auditService.list(entityType, from, to, pageable));
    }

    @GetMapping("/logs/export")
    @Operation(summary = "Экспорт журнала в Excel")
    public ResponseEntity<byte[]> exportLogs(
        @RequestParam(required = false) FinanceAuditEntityType entityType,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        byte[] data = exportService.exportAudit(entityType, from, to);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=finance-audit.xlsx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(data);
    }
}
