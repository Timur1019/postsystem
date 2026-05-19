package com.pos.controller;

import com.pos.dto.cashregister.CashRegisterDetailResponse;
import com.pos.dto.cashregister.CashRegisterRowResponse;
import com.pos.dto.cashregister.CashTransferRowResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.service.CashRegisterService;
import com.pos.service.CashTransferService;
import com.pos.service.export.CashTransferExportService;
import com.pos.spreadsheet.SpreadsheetDownloadSupport;
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
public class CashRegisterController {

    private final CashRegisterService cashRegisterService;
    private final CashTransferService cashTransferService;
    private final CashTransferExportService cashTransferExportService;

    @GetMapping("/equipment-serials")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<String>> listEquipmentSerials() {
        return ResponseEntity.ok(cashRegisterService.listDistinctEquipmentSerials());
    }

    @GetMapping("/transfers/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
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
    public ResponseEntity<CashRegisterDetailResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(cashRegisterService.getById(id));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CashRegisterRowResponse> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(cashRegisterService.toggleStatus(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
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
