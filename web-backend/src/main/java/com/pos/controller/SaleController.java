package com.pos.controller;

import com.pos.dto.sale.CreateSaleRequest;
import com.pos.dto.sale.PartialReturnRequest;
import com.pos.dto.sale.SaleResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.exception.BadRequestException;
import com.pos.service.SaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import com.pos.spreadsheet.SpreadsheetDownloadSupport;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.pos.entity.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;

    @PostMapping
    public ResponseEntity<SaleResponse> createSale(
        @Valid @RequestBody CreateSaleRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(saleService.processSale(request, currentUser.getId()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PageResponse<SaleResponse>> getSales(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String cashierId,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String receiptNumber,
        @RequestParam(required = false) String saleId,
        @RequestParam(required = false) String cashierName,
        @RequestParam(required = false) String paymentMethod,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String paymentSettlement,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(saleService.getSales(
            from, to, cashierId, search, receiptNumber, saleId, cashierName,
            paymentMethod, status, paymentSettlement,
            storeId != null ? String.valueOf(storeId) : null,
            pageable
        ));
    }

    @GetMapping(value = "/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<byte[]> exportSoldLines(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String cashierId,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String receiptNumber,
        @RequestParam(required = false) String saleId,
        @RequestParam(required = false) String cashierName,
        @RequestParam(required = false) String paymentMethod,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String paymentSettlement,
        @RequestParam(required = false) Integer storeId
    ) {
        byte[] body = saleService.exportSoldLinesExcel(
            from, to, cashierId, search, receiptNumber, saleId, cashierName,
            paymentMethod, status, paymentSettlement,
            storeId != null ? String.valueOf(storeId) : null
        );
        return SpreadsheetDownloadSupport.attachment(body, "sales_ledger_export.xlsx");
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleResponse> getSale(@PathVariable UUID id) {
        return ResponseEntity.ok(saleService.getSale(id));
    }

    @GetMapping("/receipt/{receiptNumber}")
    public ResponseEntity<SaleResponse> getByReceipt(@PathVariable String receiptNumber) {
        return ResponseEntity.ok(saleService.getByReceiptNumber(receiptNumber));
    }

    @PostMapping("/{id}/void")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
    public ResponseEntity<SaleResponse> voidSale(
        @PathVariable UUID id,
        @RequestParam(required = false) String reason
    ) {
        return ResponseEntity.ok(saleService.voidSale(id, reason));
    }

    @PostMapping("/{id}/return-items")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
    public ResponseEntity<SaleResponse> returnItems(
        @PathVariable UUID id,
        @Valid @RequestBody PartialReturnRequest request
    ) {
        return ResponseEntity.ok(saleService.returnItems(id, request));
    }

    @GetMapping("/my-sales")
    public ResponseEntity<PageResponse<SaleResponse>> mySales(
        @AuthenticationPrincipal User currentUser,
        @RequestParam(required = false) UUID shiftId,
        @RequestParam(required = false) UUID excludeShiftId,
        @RequestParam(required = false) String receiptNumber,
        @RequestParam(required = false) String paymentMethod,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @PageableDefault(size = 10) Pageable pageable
    ) {
        if (shiftId != null && excludeShiftId != null) {
            throw new BadRequestException("Use either shiftId or excludeShiftId, not both");
        }
        return ResponseEntity.ok(
            saleService.getSalesByCashier(
                currentUser.getId(),
                shiftId,
                excludeShiftId,
                receiptNumber,
                paymentMethod,
                status,
                from,
                to,
                pageable
            )
        );
    }
}
