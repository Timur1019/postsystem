package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.product.BulkProductIdsRequest;
import com.pos.dto.product.BulkTaxRateRequest;
import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.ProductExportPreviewRow;
import com.pos.dto.product.ProductExportRequest;
import com.pos.dto.product.ProductImportConfirmRequest;
import com.pos.dto.product.ProductImportPreviewResponse;
import com.pos.dto.product.ProductImportResponse;
import com.pos.dto.product.ProductLifecycleResponse;
import com.pos.dto.product.ProductResponse;
import com.pos.dto.product.UpdateProductRequest;

import java.math.BigDecimal;
import java.util.List;

import com.pos.dto.shared.PageResponse;
import com.pos.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import com.pos.spreadsheet.ExcelMediaTypes;
import com.pos.spreadsheet.SpreadsheetDownloadSupport;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Каталог товаров, остатки, импорт и экспорт")
@StandardApiResponses
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Список товаров", description = "Постраничный каталог товаров с фильтрами")
    @ApiResponse(responseCode = "200", description = "Список товаров")
    public ResponseEntity<PageResponse<ProductResponse>> getAllProducts(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(defaultValue = "true") boolean activeOnly,
        @RequestParam(required = false) String deletedScope,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) String ikpuStatus,
        @RequestParam(required = false) Boolean markedProduct,
        @RequestParam(required = false) Boolean soldIndividually,
        @RequestParam(required = false) String barcode,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(productService.getProducts(
            search, categoryId, activeOnly, deletedScope, storeId, ikpuStatus,
            markedProduct, soldIndividually, barcode, pageable
        ));
    }

    @GetMapping("/export/preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Предпросмотр экспорта", description = "Предварительный просмотр данных для экспорта каталога")
    @ApiResponse(responseCode = "200", description = "Данные предпросмотра")
    public ResponseEntity<List<ProductExportPreviewRow>> exportPreview(
        @RequestParam(required = false) String storeIds,
        @RequestParam(required = false) BigDecimal markupPercent
    ) {
        return ResponseEntity.ok(productService.previewProductsExport(storeIds, markupPercent));
    }

    @PostMapping(
        value = "/export",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = ExcelMediaTypes.XLSX
    )
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Экспорт каталога", description = "Выгрузка каталога товаров в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportProductsExcel(@RequestBody(required = false) ProductExportRequest request) {
        byte[] body = productService.exportProductsCatalogExcel(request);
        return SpreadsheetDownloadSupport.attachment(body, "products_export.xlsx");
    }

    @GetMapping("/{id}")
    @Operation(summary = "Товар по ID", description = "Получение товара по UUID")
    @ApiResponse(responseCode = "200", description = "Данные товара")
    public ResponseEntity<ProductResponse> getProduct(
        @PathVariable UUID id,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(productService.getProduct(id, storeId));
    }

    @GetMapping("/{id}/lifecycle")
    @Operation(summary = "Жизненный цикл товара", description = "История движений и операций по товару")
    @ApiResponse(responseCode = "200", description = "История товара")
    public ResponseEntity<ProductLifecycleResponse> getProductLifecycle(
        @PathVariable UUID id,
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to,
        @RequestParam(required = false) String movementType,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 30) Pageable pageable
    ) {
        return ResponseEntity.ok(
            productService.getProductLifecycle(id, from, to, movementType, storeId, pageable)
        );
    }

    @GetMapping("/barcode/{barcode}")
    @Operation(summary = "Товар по штрихкоду", description = "Поиск товара по штрихкоду")
    @ApiResponse(responseCode = "200", description = "Данные товара")
    public ResponseEntity<ProductResponse> getByBarcode(
        @PathVariable String barcode,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(
            storeId != null ? productService.getByBarcode(barcode, storeId) : productService.getByBarcode(barcode)
        );
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать товар", description = "Добавление нового товара в каталог")
    @ApiResponse(responseCode = "201", description = "Товар создан")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody CreateProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить товар", description = "Изменение данных товара")
    @ApiResponse(responseCode = "200", description = "Товар обновлён")
    public ResponseEntity<ProductResponse> updateProduct(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateProductRequest request
    ) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Корректировка остатка", description = "Ручная корректировка складского остатка товара")
    @ApiResponse(responseCode = "200", description = "Остаток скорректирован")
    public ResponseEntity<ProductResponse> adjustStock(
        @PathVariable UUID id,
        @RequestParam BigDecimal quantity,
        @RequestParam(defaultValue = "ADJUSTMENT") String movementType,
        @RequestParam(required = false) String notes,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(productService.adjustStock(id, quantity, movementType, notes, storeId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Деактивировать товар", description = "Мягкое удаление (деактивация) товара")
    @ApiResponse(responseCode = "200", description = "Товар деактивирован")
    public ResponseEntity<com.pos.dto.shared.ApiResponse> deleteProduct(@PathVariable UUID id) {
        productService.deactivateProduct(id);
        return ResponseEntity.ok(com.pos.dto.shared.ApiResponse.success("Product deactivated"));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Товары с низким остатком", description = "Список товаров ниже минимального порога")
    @ApiResponse(responseCode = "200", description = "Список товаров")
    public ResponseEntity<?> getLowStockProducts() {
        return ResponseEntity.ok(productService.getLowStockProducts());
    }

    @PatchMapping("/bulk/tax-rate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Массовое изменение НДС", description = "Обновление ставки налога для выбранных товаров")
    @ApiResponse(responseCode = "200", description = "НДС обновлён")
    public ResponseEntity<com.pos.dto.shared.ApiResponse> bulkTaxRate(@Valid @RequestBody BulkTaxRateRequest request) {
        int n = productService.bulkUpdateTaxRate(request);
        return ResponseEntity.ok(com.pos.dto.shared.ApiResponse.success("Updated tax for " + n + " products"));
    }

    @PatchMapping("/bulk/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Массовая деактивация", description = "Деактивация нескольких товаров по списку ID")
    @ApiResponse(responseCode = "200", description = "Товары деактивированы")
    public ResponseEntity<com.pos.dto.shared.ApiResponse> bulkDeactivate(@Valid @RequestBody BulkProductIdsRequest request) {
        int n = productService.bulkDeactivateProducts(request.productIds());
        return ResponseEntity.ok(com.pos.dto.shared.ApiResponse.success("Deactivated " + n + " products"));
    }

    @GetMapping(value = "/import/template")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Шаблон импорта", description = "Скачивание Excel-шаблона для импорта товаров")
    @ApiResponse(responseCode = "200", description = "Файл шаблона")
    public ResponseEntity<byte[]> importTemplate() {
        byte[] body = productService.buildImportTemplateExcel();
        return SpreadsheetDownloadSupport.attachment(body, "products_import_template.xlsx");
    }

    @PostMapping(value = "/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Предпросмотр импорта", description = "Разбор файла импорта без сохранения в БД")
    @ApiResponse(responseCode = "200", description = "Результат предпросмотра")
    public ResponseEntity<ProductImportPreviewResponse> importPreview(
        @RequestPart("file") MultipartFile file,
        @RequestParam(value = "source", defaultValue = "CATALOG") String source,
        @RequestParam(value = "defaultStorageLocation", required = false) String defaultStorageLocation
    ) {
        return ResponseEntity.ok(
            productService.previewProductsImport(file, source, defaultStorageLocation)
        );
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Импорт товаров", description = "Загрузка товаров из Excel-файла")
    @ApiResponse(responseCode = "200", description = "Результат импорта")
    public ResponseEntity<ProductImportResponse> importProducts(
        @RequestPart("file") MultipartFile file,
        @RequestPart(value = "options", required = false) ProductImportConfirmRequest options
    ) {
        return ResponseEntity.ok(productService.importFromFile(file, options));
    }
}
