package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.report.sales.CategorySalesRowResponse;
import com.pos.dto.report.sales.ProductSalesRowResponse;
import com.pos.dto.report.sales.StoreSalesRowResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.service.export.ReportExportService;
import com.pos.service.stock.StockReportService;
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
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/reports/sales")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Reports — Sales", description = "Аналитика продаж по товарам, категориям и магазинам")
@StandardApiResponses
public class ProductSalesReportController {

    private final StockReportService stockReportService;
    private final ReportExportService reportExportService;

    @GetMapping("/by-products")
    @Operation(summary = "Продажи по товарам", description = "Отчёт продаж в разрезе товаров за период")
    @ApiResponse(responseCode = "200", description = "Отчёт по товарам")
    public ResponseEntity<PageResponse<ProductSalesRowResponse>> byProducts(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) String search,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(
            stockReportService.productSales(from, to, storeId, categoryId, search, pageable)
        );
    }

    @GetMapping(value = "/by-products/export")
    @Operation(summary = "Экспорт продаж по товарам", description = "Выгрузка отчёта продаж по товарам в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportByProducts(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) String search
    ) {
        return SpreadsheetDownloadSupport.attachment(
            reportExportService.exportSalesByProducts(from, to, storeId, categoryId, search),
            "sales_by_products_export.xlsx"
        );
    }

    @GetMapping("/by-categories")
    @Operation(summary = "Продажи по категориям", description = "Отчёт продаж в разрезе категорий за период")
    @ApiResponse(responseCode = "200", description = "Отчёт по категориям")
    public ResponseEntity<PageResponse<CategorySalesRowResponse>> byCategories(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockReportService.categorySales(from, to, storeId, pageable));
    }

    @GetMapping(value = "/by-categories/export")
    @Operation(summary = "Экспорт продаж по категориям", description = "Выгрузка отчёта продаж по категориям в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportByCategories(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId
    ) {
        return SpreadsheetDownloadSupport.attachment(
            reportExportService.exportSalesByCategories(from, to, storeId),
            "sales_by_categories_export.xlsx"
        );
    }

    @GetMapping("/by-stores")
    @Operation(summary = "Продажи по магазинам", description = "Отчёт продаж в разрезе торговых точек")
    @ApiResponse(responseCode = "200", description = "Отчёт по магазинам")
    public ResponseEntity<PageResponse<StoreSalesRowResponse>> byStores(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockReportService.storeSales(from, to, pageable));
    }

    @GetMapping(value = "/by-stores/export")
    @Operation(summary = "Экспорт продаж по магазинам", description = "Выгрузка отчёта продаж по магазинам в Excel")
    @ApiResponse(responseCode = "200", description = "Файл Excel")
    public ResponseEntity<byte[]> exportByStores(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return SpreadsheetDownloadSupport.attachment(
            reportExportService.exportSalesByStores(from, to),
            "sales_by_stores_export.xlsx"
        );
    }
}
