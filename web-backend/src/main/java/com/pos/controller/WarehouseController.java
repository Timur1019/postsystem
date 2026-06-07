package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.product.ProductResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.warehouse.CreateStockInventoryRequest;
import com.pos.dto.warehouse.CreateStockReceiptRequest;
import com.pos.dto.warehouse.CreateStockTransferRequest;
import com.pos.dto.warehouse.StockInventoryResponse;
import com.pos.dto.warehouse.StockReceiptResponse;
import com.pos.dto.warehouse.StockTransferResponse;
import com.pos.dto.warehouse.WarehouseReceiveRequest;
import com.pos.service.ProductService;
import com.pos.service.stock.StockInventoryService;
import com.pos.service.stock.StockReceiptService;
import com.pos.service.stock.StockTransferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Складской UI: те же товары и поле {@code stock_quantity}, что и {@code /products}.
 * Отдельный префикс — удобные фильтры (штрихкод, маркировка); БД одна.
 */
@RestController
@RequestMapping("/warehouse")
@RequiredArgsConstructor
@Tag(name = "Warehouse", description = "Складские операции: приход, инвентаризация, перемещения")
@StandardApiResponses
public class WarehouseController {

    private final ProductService productService;
    private final StockReceiptService stockReceiptService;
    private final StockInventoryService stockInventoryService;
    private final StockTransferService stockTransferService;

    @GetMapping("/products")
    @Operation(summary = "Товары склада", description = "Список товаров с фильтрами для складского интерфейса")
    @ApiResponse(responseCode = "200", description = "Список товаров")
    public ResponseEntity<PageResponse<ProductResponse>> listWarehouseProducts(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String barcode,
        @RequestParam(required = false) Boolean markedProduct,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(productService.getWarehouseProducts(search, barcode, markedProduct, pageable));
    }

    @PostMapping("/receipt")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Быстрый приход", description = "Приём товара на склад одной операцией")
    @ApiResponse(responseCode = "200", description = "Товар принят")
    public ResponseEntity<ProductResponse> receiveStock(@Valid @RequestBody WarehouseReceiveRequest request) {
        return ResponseEntity.ok(productService.receiveWarehouseStock(request));
    }

    /** Приход на несколько строк (документ REC-…). */
    @PostMapping("/receipts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать приход", description = "Оформление документа прихода на несколько позиций")
    @ApiResponse(responseCode = "200", description = "Документ прихода создан")
    public ResponseEntity<StockReceiptResponse> createReceipt(@Valid @RequestBody CreateStockReceiptRequest request) {
        return ResponseEntity.ok(stockReceiptService.create(request));
    }

    @GetMapping("/receipts/{id}")
    @Operation(summary = "Приход по ID", description = "Получение документа прихода")
    @ApiResponse(responseCode = "200", description = "Данные прихода")
    public ResponseEntity<StockReceiptResponse> getReceipt(@PathVariable UUID id) {
        return ResponseEntity.ok(stockReceiptService.getById(id));
    }

    @PostMapping("/inventories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать инвентаризацию", description = "Оформление документа инвентаризации")
    @ApiResponse(responseCode = "200", description = "Инвентаризация создана")
    public ResponseEntity<StockInventoryResponse> createInventory(
        @Valid @RequestBody CreateStockInventoryRequest request
    ) {
        return ResponseEntity.ok(stockInventoryService.create(request));
    }

    @GetMapping("/inventories/{id}")
    @Operation(summary = "Инвентаризация по ID", description = "Получение документа инвентаризации")
    @ApiResponse(responseCode = "200", description = "Данные инвентаризации")
    public ResponseEntity<StockInventoryResponse> getInventory(@PathVariable UUID id) {
        return ResponseEntity.ok(stockInventoryService.getById(id));
    }

    @PostMapping("/transfers")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать перемещение", description = "Перемещение товара между складами/магазинами")
    @ApiResponse(responseCode = "200", description = "Перемещение создано")
    public ResponseEntity<StockTransferResponse> createTransfer(
        @Valid @RequestBody CreateStockTransferRequest request
    ) {
        return ResponseEntity.ok(stockTransferService.create(request));
    }

    @GetMapping("/transfers/{id}")
    @Operation(summary = "Перемещение по ID", description = "Получение документа перемещения")
    @ApiResponse(responseCode = "200", description = "Данные перемещения")
    public ResponseEntity<StockTransferResponse> getTransfer(@PathVariable UUID id) {
        return ResponseEntity.ok(stockTransferService.getById(id));
    }
}
