package com.pos.controller;

import com.pos.dto.report.sales.CategorySalesRowResponse;
import com.pos.dto.report.sales.ProductSalesRowResponse;
import com.pos.dto.report.sales.StoreSalesRowResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.service.export.ReportExportService;
import com.pos.service.stock.StockReportService;
import com.pos.spreadsheet.SpreadsheetDownloadSupport;
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
public class ProductSalesReportController {

    private final StockReportService stockReportService;
    private final ReportExportService reportExportService;

    @GetMapping("/by-products")
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
    public ResponseEntity<PageResponse<CategorySalesRowResponse>> byCategories(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockReportService.categorySales(from, to, storeId, pageable));
    }

    @GetMapping(value = "/by-categories/export")
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
    public ResponseEntity<PageResponse<StoreSalesRowResponse>> byStores(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockReportService.storeSales(from, to, pageable));
    }

    @GetMapping(value = "/by-stores/export")
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
