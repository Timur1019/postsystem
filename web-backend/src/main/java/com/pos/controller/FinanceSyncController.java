package com.pos.controller;

import com.pos.dto.finance.FinanceSyncBackfillResponse;
import com.pos.dto.finance.FinanceSyncOutboxDto;
import com.pos.dto.shared.PageResponse;
import com.pos.service.finance.FinanceSyncAdminService;
import com.pos.service.finance.FinanceSyncBackfillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/finance-sync")
@RequiredArgsConstructor
@Tag(name = "Finance Sync", description = "Синхронизация POS → finance-service")
public class FinanceSyncController {

    private final FinanceSyncBackfillService backfillService;
    private final FinanceSyncAdminService adminService;

    @PostMapping("/backfill")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Догрузить продажи и закупы в finance за период")
    public ResponseEntity<FinanceSyncBackfillResponse> backfill(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "sales,purchases") String types
    ) {
        Set<String> typeSet = Arrays.stream(types.split(","))
            .map(String::trim)
            .map(String::toLowerCase)
            .filter(s -> !s.isBlank())
            .collect(Collectors.toSet());
        return ResponseEntity.ok(backfillService.backfill(from, to, typeSet));
    }

    @GetMapping("/outbox")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Очередь синхронизации с finance-service")
    public ResponseEntity<PageResponse<FinanceSyncOutboxDto>> outbox(
        @RequestParam(required = false) String status,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.listOutbox(status, pageable));
    }

    @PostMapping("/outbox/{id}/retry")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Повторить отправку одной записи outbox")
    public ResponseEntity<Void> retryOutbox(@PathVariable UUID id) {
        adminService.retryOutbox(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/retry-pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обработать пакет ожидающих записей outbox")
    public ResponseEntity<Map<String, Integer>> retryPending() {
        return ResponseEntity.ok(Map.of("processed", adminService.retryPendingBatch()));
    }
}
