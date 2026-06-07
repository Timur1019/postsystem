package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.report.stock.DeadStockRowResponse;
import com.pos.dto.report.stock.LowStockRowResponse;
import com.pos.dto.report.stock.StockBalanceRowResponse;
import com.pos.dto.report.stock.StockDashboardResponse;
import com.pos.dto.report.stock.StockMovementRowResponse;
import com.pos.dto.report.stock.StockTurnoverRowResponse;
import com.pos.dto.warehouse.StockReceiptResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.stock.CreateWriteOffRequest;
import com.pos.dto.stock.WriteOffRowResponse;
import com.pos.dto.warehouse.StockInventoryResponse;
import com.pos.dto.warehouse.StockTransferResponse;
import com.pos.service.export.ReportExportService;
import com.pos.service.stock.StockInventoryService;
import com.pos.service.stock.StockReportService;
import com.pos.service.stock.StockTransferService;
import com.pos.service.stock.StockWriteOffService;
import com.pos.spreadsheet.SpreadsheetDownloadSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/reports/stock")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Reports — Stock", description = "Складская аналитика: остатки, движения, списания, оборот")
@StandardApiResponses
public class StockReportController {

    private final StockReportService stockReportService;
    private final StockWriteOffService stockWriteOffService;
    private final StockInventoryService stockInventoryService;
    private final StockTransferService stockTransferService;
    private final ReportExportService reportExportService;

    @GetMapping("/dashboard")
    @Operation(summary = "Дашборд склада", description = "Сводные показатели складских операций за период")
    @ApiResponse(responseCode = "200", description = "Данные дашборда")
    public ResponseEntity<StockDashboardResponse> dashboard(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(stockReportService.dashboard(from, to, storeId));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Низкие остатки", description = "Товары с остатком ниже минимального порога")
    @ApiResponse(responseCode = "200", description = "Список товаров")
    public ResponseEntity<PageResponse<LowStockRowResponse>> lowStock(
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockReportService.lowStock(pageable));
    }

    @GetMapping("/write-offs")
    @Operation(summary = "Журнал списаний", description = "Список списаний товаров за период")
    @ApiResponse(responseCode = "200", description = "Список списаний")
    public ResponseEntity<PageResponse<WriteOffRowResponse>> writeOffs(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockWriteOffService.list(from, to, storeId, pageable));
    }

    @PostMapping("/write-offs")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать списание", description = "Оформление списания товара со склада")
    @ApiResponse(responseCode = "201", description = "Списание создано")
    public ResponseEntity<WriteOffRowResponse> createWriteOff(@Valid @RequestBody CreateWriteOffRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockWriteOffService.create(request));
    }

    @GetMapping("/turnover")
    @Operation(summary = "Оборачиваемость", description = "Отчёт оборачиваемости товаров за период")
    @ApiResponse(responseCode = "200", description = "Отчёт оборачиваемости")
    public ResponseEntity<PageResponse<StockTurnoverRowResponse>> turnover(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) String search,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockReportService.turnover(from, to, categoryId, search, pageable));
    }

    @GetMapping("/movements")
    @Operation(summary = "Журнал движений", description = "Все складские движения товаров за период")
    @ApiResponse(responseCode = "200", description = "Журнал движений")
    public ResponseEntity<PageResponse<StockMovementRowResponse>> movements(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String movementType,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) String search,
        @PageableDefault(size = 30) Pageable pageable
    ) {
        return ResponseEntity.ok(
            stockReportService.movementJournal(from, to, movementType, storeId, search, pageable)
        );
    }

    @GetMapping("/receipts")
    @Operation(summary = "Журнал приходов", description = "Документы прихода товаров за период")
    @ApiResponse(responseCode = "200", description = "Журнал приходов")
    public ResponseEntity<PageResponse<StockReceiptResponse>> receipts(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockReportService.receipts(from, to, storeId, pageable));
    }

    @GetMapping("/balances")
    @Operation(summary = "Остатки товаров", description = "Текущие складские остатки с фильтрами")
    @ApiResponse(responseCode = "200", description = "Остатки товаров")
    public ResponseEntity<PageResponse<StockBalanceRowResponse>> balances(
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "false") boolean onlyWithStock,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockReportService.stockBalances(categoryId, search, onlyWithStock, pageable));
    }

    @GetMapping(value = "/balances/export")
    @Operation(summary = "Экспорт остатков", description = "Выгрузка остатков товаров в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportBalances(
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "false") boolean onlyWithStock
    ) {
        return SpreadsheetDownloadSupport.attachment(
            reportExportService.exportStockBalances(categoryId, search, onlyWithStock),
            "stock_balances_export.xlsx"
        );
    }

    @GetMapping("/dead-stock")
    @Operation(summary = "Неликвид", description = "Товары без продаж за указанный период")
    @ApiResponse(responseCode = "200", description = "Список неликвида")
    public ResponseEntity<PageResponse<DeadStockRowResponse>> deadStock(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
        @RequestParam(defaultValue = "30") int daysNoSale,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) String search,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(
            stockReportService.deadStock(asOfDate, daysNoSale, categoryId, search, pageable)
        );
    }

    @GetMapping(value = "/dead-stock/export")
    @Operation(summary = "Экспорт неликвида", description = "Выгрузка отчёта неликвида в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportDeadStock(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
        @RequestParam(defaultValue = "30") int daysNoSale,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) String search
    ) {
        return SpreadsheetDownloadSupport.attachment(
            reportExportService.exportDeadStock(asOfDate, daysNoSale, categoryId, search),
            "dead_stock_export.xlsx"
        );
    }

    @GetMapping("/adjustments")
    @Operation(summary = "Корректировки остатков", description = "Журнал ручных корректировок склада")
    @ApiResponse(responseCode = "200", description = "Журнал корректировок")
    public ResponseEntity<PageResponse<StockMovementRowResponse>> adjustments(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) String search,
        @PageableDefault(size = 30) Pageable pageable
    ) {
        return ResponseEntity.ok(
            stockReportService.movementJournal(from, to, "ADJUSTMENT", storeId, search, pageable)
        );
    }

    @GetMapping(value = "/adjustments/export")
    @Operation(summary = "Экспорт корректировок", description = "Выгрузка журнала корректировок в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportAdjustments(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) String search
    ) {
        return SpreadsheetDownloadSupport.attachment(
            reportExportService.exportAdjustments(from, to, storeId, search),
            "stock_adjustments_export.xlsx"
        );
    }

    @GetMapping("/inventories")
    @Operation(summary = "Журнал инвентаризаций", description = "Документы инвентаризации за период")
    @ApiResponse(responseCode = "200", description = "Журнал инвентаризаций")
    public ResponseEntity<PageResponse<StockInventoryResponse>> inventories(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockInventoryService.list(from, to, storeId, pageable));
    }

    @GetMapping(value = "/inventories/export")
    @Operation(summary = "Экспорт инвентаризаций", description = "Выгрузка журнала инвентаризаций в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportInventories(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId
    ) {
        return SpreadsheetDownloadSupport.attachment(
            reportExportService.exportInventories(from, to, storeId),
            "stock_inventories_export.xlsx"
        );
    }

    @GetMapping("/transfers")
    @Operation(summary = "Журнал перемещений", description = "Документы перемещения товаров за период")
    @ApiResponse(responseCode = "200", description = "Журнал перемещений")
    public ResponseEntity<PageResponse<StockTransferResponse>> transfers(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer fromStoreId,
        @RequestParam(required = false) Integer toStoreId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockTransferService.list(from, to, fromStoreId, toStoreId, pageable));
    }

    @GetMapping(value = "/transfers/export")
    @Operation(summary = "Экспорт перемещений", description = "Выгрузка журнала перемещений в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportTransfers(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer fromStoreId,
        @RequestParam(required = false) Integer toStoreId
    ) {
        return SpreadsheetDownloadSupport.attachment(
            reportExportService.exportTransfers(from, to, fromStoreId, toStoreId),
            "stock_transfers_export.xlsx"
        );
    }
}
