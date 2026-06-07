package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.cashregister.CashRegisterDetailResponse;
import com.pos.dto.cashregister.CashRegisterRowResponse;
import com.pos.dto.cashregister.CashTransferRowResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.service.CashRegisterService;
import com.pos.service.CashTransferService;
import com.pos.service.export.CashTransferExportService;
import com.pos.spreadsheet.SpreadsheetDownloadSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/cash-registers")
@RequiredArgsConstructor
@Tag(name = "Cash Registers", description = "Кассовое оборудование и инкассации")
@StandardApiResponses
public class CashRegisterController {

    private final CashRegisterService cashRegisterService;
    private final CashTransferService cashTransferService;
    private final CashTransferExportService cashTransferExportService;

    @GetMapping("/equipment-serials")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Серийные номера", description = "Список уникальных серийных номеров оборудования")
    @ApiResponse(responseCode = "200", description = "Список серийных номеров")
    public ResponseEntity<List<String>> listEquipmentSerials() {
        return ResponseEntity.ok(cashRegisterService.listDistinctEquipmentSerials());
    }

    @GetMapping("/transfers/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Экспорт инкассаций", description = "Выгрузка журнала инкассаций в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportTransfers(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) Integer registerNumber,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate closedFrom,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate closedTo
    ) {
        byte[] body = cashTransferExportService.exportTransfersExcel(
            search,
            registerNumber,
            closedFrom,
            closedTo
        );
        return SpreadsheetDownloadSupport.attachment(body, "cash_transfer_export.xlsx");
    }

    @GetMapping("/transfers")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Журнал инкассаций", description = "Постраничный список инкассаций с фильтрами")
    @ApiResponse(responseCode = "200", description = "Список инкассаций")
    public ResponseEntity<PageResponse<CashTransferRowResponse>> listTransfers(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) Integer registerNumber,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate closedFrom,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate closedTo,
        @PageableDefault(size = 14) Pageable pageable
    ) {
        return ResponseEntity.ok(
            cashTransferService.list(search, registerNumber, closedFrom, closedTo, pageable)
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Касса по ID", description = "Детальная информация о кассовом аппарате")
    @ApiResponse(responseCode = "200", description = "Данные кассы")
    public ResponseEntity<CashRegisterDetailResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(cashRegisterService.getById(id));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Переключить статус", description = "Активация или деактивация кассового аппарата")
    @ApiResponse(responseCode = "200", description = "Статус изменён")
    public ResponseEntity<CashRegisterRowResponse> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(cashRegisterService.toggleStatus(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Список касс", description = "Постраничный список кассовых аппаратов")
    @ApiResponse(responseCode = "200", description = "Список касс")
    public ResponseEntity<PageResponse<CashRegisterRowResponse>> list(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String equipmentModel,
        @RequestParam(required = false) String equipmentSerial,
        @RequestParam(required = false) String fiscalCardId,
        @PageableDefault(size = 14) Pageable pageable
    ) {
        return ResponseEntity.ok(
            cashRegisterService.list(search, equipmentModel, equipmentSerial, fiscalCardId, pageable)
        );
    }
}
