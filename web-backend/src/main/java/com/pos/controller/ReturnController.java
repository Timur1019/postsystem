package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.returns.ReturnRowResponse;
import com.pos.dto.returns.UpdateReturnReasonRequest;
import com.pos.dto.sale.SaleResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.service.ReturnService;
import com.pos.service.export.ReturnExportService;
import com.pos.spreadsheet.SpreadsheetDownloadSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/returns")
@RequiredArgsConstructor
@Tag(name = "Returns", description = "Журнал возвратов и управление ими")
@StandardApiResponses
public class ReturnController {

    private final ReturnService returnService;
    private final ReturnExportService returnExportService;

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Экспорт возвратов", description = "Выгрузка журнала возвратов в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportExcel(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String cashierName,
        @RequestParam(required = false) String fiscalSearch,
        @RequestParam(required = false) Integer storeId
    ) {
        byte[] body = returnExportService.exportReturnsExcel(from, to, cashierName, fiscalSearch, storeId);
        return SpreadsheetDownloadSupport.attachment(body, "returns_report.xlsx");
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Список возвратов", description = "Постраничный журнал возвратов с фильтрами")
    @ApiResponse(responseCode = "200", description = "Список возвратов")
    public ResponseEntity<PageResponse<ReturnRowResponse>> list(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String cashierName,
        @RequestParam(required = false) String fiscalSearch,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(returnService.list(from, to, cashierName, fiscalSearch, storeId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Детали возврата", description = "Получение детальной информации о возврате")
    @ApiResponse(responseCode = "200", description = "Данные возврата")
    public ResponseEntity<SaleResponse> getDetails(@PathVariable UUID id) {
        return ResponseEntity.ok(returnService.getDetails(id));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Изменить причину", description = "Обновление причины возврата")
    @ApiResponse(responseCode = "200", description = "Причина обновлена")
    public ResponseEntity<ReturnRowResponse> updateReason(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateReturnReasonRequest request
    ) {
        return ResponseEntity.ok(returnService.updateReason(id, request.reason()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Отменить возврат", description = "Отмена оформленного возврата")
    @ApiResponse(responseCode = "204", description = "Возврат отменён")
    public ResponseEntity<Void> cancelReturn(@PathVariable UUID id) {
        returnService.cancelReturn(id);
        return ResponseEntity.noContent().build();
    }
}
