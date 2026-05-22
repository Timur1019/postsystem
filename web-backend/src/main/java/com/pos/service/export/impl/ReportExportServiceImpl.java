package com.pos.service.export.impl;

import com.pos.dto.report.CashierStat;
import com.pos.dto.report.DailySummaryResponse;
import com.pos.dto.report.sales.CategorySalesRowResponse;
import com.pos.dto.report.sales.PeriodCompareResponse;
import com.pos.dto.report.sales.ProductSalesRowResponse;
import com.pos.dto.report.sales.StoreSalesRowResponse;
import com.pos.dto.report.stock.DeadStockRowResponse;
import com.pos.dto.report.stock.StockBalanceRowResponse;
import com.pos.dto.report.stock.StockMovementRowResponse;
import com.pos.dto.warehouse.StockInventoryResponse;
import com.pos.dto.warehouse.StockTransferResponse;
import com.pos.service.ReportService;
import com.pos.service.export.ReportExportService;
import com.pos.service.stock.StockInventoryService;
import com.pos.service.stock.StockReportService;
import com.pos.service.stock.StockTransferService;
import com.pos.spreadsheet.ExcelSpreadsheetWriter;
import com.pos.spreadsheet.ExcelTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportExportServiceImpl implements ReportExportService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm").withZone(ZONE);

    private final StockReportService stockReportService;
    private final ReportService reportService;
    private final StockInventoryService stockInventoryService;
    private final StockTransferService stockTransferService;
    private final ExcelSpreadsheetWriter excelWriter;

    @Override
    public byte[] exportSalesByProducts(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Integer categoryId,
        String search
    ) {
        String q = trimSearch(search);
        List<ProductSalesRowResponse> rows = stockReportService
            .productSales(from, to, storeId, categoryId, q, Pageable.unpaged())
            .content();
        List<Map<String, Object>> data = new ArrayList<>();
        for (ProductSalesRowResponse r : rows) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("product_name", r.productName());
            row.put("sku", r.sku());
            row.put("barcode", r.barcode());
            row.put("category", r.categoryName());
            row.put("sold_qty", r.quantitySold());
            row.put("returned_qty", r.quantityReturned());
            row.put("net_qty", r.netQuantity());
            row.put("revenue", r.revenue());
            row.put("cost", r.costEstimate());
            row.put("margin", r.margin());
            data.add(row);
        }
        return excelWriter.write(ExcelTemplate.SALES_BY_PRODUCTS, data);
    }

    @Override
    public byte[] exportSalesByCategories(LocalDate from, LocalDate to, Integer storeId) {
        List<CategorySalesRowResponse> rows = stockReportService
            .categorySales(from, to, storeId, Pageable.unpaged())
            .content();
        List<Map<String, Object>> data = new ArrayList<>();
        for (CategorySalesRowResponse r : rows) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("category", blank(r.categoryName()));
            row.put("receipt_count", r.receiptCount());
            row.put("net_qty", r.netQuantity());
            row.put("returned_qty", r.quantityReturned());
            row.put("revenue", r.revenue());
            row.put("cost", r.costEstimate());
            row.put("margin", r.margin());
            data.add(row);
        }
        return excelWriter.write(ExcelTemplate.SALES_BY_CATEGORIES, data);
    }

    @Override
    public byte[] exportSalesByStores(LocalDate from, LocalDate to) {
        List<StoreSalesRowResponse> rows = stockReportService
            .storeSales(from, to, Pageable.unpaged())
            .content();
        List<Map<String, Object>> data = new ArrayList<>();
        for (StoreSalesRowResponse r : rows) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("store", r.storeName());
            row.put("receipt_count", r.receiptCount());
            row.put("net_qty", r.netQuantity());
            row.put("returned_qty", r.quantityReturned());
            row.put("revenue", r.revenue());
            row.put("cost", r.costEstimate());
            row.put("margin", r.margin());
            data.add(row);
        }
        return excelWriter.write(ExcelTemplate.SALES_BY_STORES, data);
    }

    @Override
    public byte[] exportPeriodCompare(LocalDate from, LocalDate to, Integer storeId) {
        PeriodCompareResponse cmp = reportService.getPeriodCompare(from, to, storeId);
        List<Map<String, Object>> data = new ArrayList<>();

        Map<String, Object> current = new LinkedHashMap<>();
        current.put("period", "Текущий");
        current.put("date_from", cmp.currentFrom());
        current.put("date_to", cmp.currentTo());
        current.put("revenue", cmp.current().revenue());
        current.put("receipt_count", cmp.current().receiptCount());
        current.put("items_sold", cmp.current().itemsSold());
        current.put("revenue_delta", cmp.deltas().revenueDelta());
        current.put("revenue_delta_pct", cmp.deltas().revenueDeltaPercent());
        current.put("receipt_delta", cmp.deltas().receiptCountDelta());
        current.put("items_delta", cmp.deltas().itemsSoldDelta());
        data.add(current);

        Map<String, Object> previous = new LinkedHashMap<>();
        previous.put("period", "Предыдущий");
        previous.put("date_from", cmp.previousFrom());
        previous.put("date_to", cmp.previousTo());
        previous.put("revenue", cmp.previous().revenue());
        previous.put("receipt_count", cmp.previous().receiptCount());
        previous.put("items_sold", cmp.previous().itemsSold());
        previous.put("revenue_delta", "");
        previous.put("revenue_delta_pct", "");
        previous.put("receipt_delta", "");
        previous.put("items_delta", "");
        data.add(previous);

        return excelWriter.write(ExcelTemplate.PERIOD_COMPARE, data);
    }

    @Override
    public byte[] exportDailySummary(LocalDate date) {
        DailySummaryResponse s = reportService.getDailySummary(date);
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("date", date != null ? date : LocalDate.now(ZONE));
        row.put("revenue", s.totalRevenue());
        row.put("receipt_count", s.transactionCount());
        row.put("items_sold", s.itemsSold());
        return excelWriter.write(ExcelTemplate.DAILY_SUMMARY, List.of(row));
    }

    @Override
    public byte[] exportCashierPerformance(LocalDate from, LocalDate to) {
        List<CashierStat> rows = reportService.getCashierPerformance(from, to);
        List<Map<String, Object>> data = new ArrayList<>();
        for (CashierStat r : rows) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("cashier", r.cashierName());
            row.put("revenue", r.revenue());
            data.add(row);
        }
        return excelWriter.write(ExcelTemplate.CASHIER_PERFORMANCE, data);
    }

    @Override
    public byte[] exportStockBalances(Integer categoryId, String search, boolean onlyWithStock) {
        String q = trimSearch(search);
        List<StockBalanceRowResponse> rows = stockReportService
            .stockBalances(categoryId, q, onlyWithStock, Pageable.unpaged())
            .content();
        List<Map<String, Object>> data = new ArrayList<>();
        for (StockBalanceRowResponse r : rows) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("product_name", r.productName());
            row.put("sku", r.sku());
            row.put("barcode", blank(r.barcode()));
            row.put("category", blank(r.categoryName()));
            row.put("stock_qty", r.stockQuantity());
            row.put("min_qty", r.lowStockAlert());
            row.put("cost_price", r.costPrice());
            row.put("stock_value", r.stockValue());
            data.add(row);
        }
        return excelWriter.write(ExcelTemplate.STOCK_BALANCES, data);
    }

    @Override
    public byte[] exportDeadStock(
        LocalDate asOfDate,
        int daysNoSale,
        Integer categoryId,
        String search
    ) {
        String q = trimSearch(search);
        List<DeadStockRowResponse> rows = stockReportService
            .deadStock(asOfDate, daysNoSale, categoryId, q, Pageable.unpaged())
            .content();
        List<Map<String, Object>> data = new ArrayList<>();
        for (DeadStockRowResponse r : rows) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("product_name", r.productName());
            row.put("sku", r.sku());
            row.put("barcode", blank(r.barcode()));
            row.put("category", blank(r.categoryName()));
            row.put("stock_qty", r.stockQuantity());
            row.put("stock_value", r.stockValue());
            row.put("last_sale_date", r.lastSaleDate() != null ? r.lastSaleDate().toString() : "");
            row.put("days_idle", r.daysWithoutSale());
            data.add(row);
        }
        return excelWriter.write(ExcelTemplate.DEAD_STOCK, data);
    }

    @Override
    public byte[] exportAdjustments(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        String search
    ) {
        String q = trimSearch(search);
        List<StockMovementRowResponse> rows = stockReportService
            .movementJournal(from, to, "ADJUSTMENT", storeId, q, Pageable.unpaged())
            .content();
        return excelWriter.write(ExcelTemplate.STOCK_ADJUSTMENTS, movementRows(rows));
    }

    @Override
    public byte[] exportInventories(LocalDate from, LocalDate to, Integer storeId) {
        List<StockInventoryResponse> rows = stockInventoryService
            .list(from, to, storeId, Pageable.unpaged())
            .content();
        List<Map<String, Object>> data = new ArrayList<>();
        for (StockInventoryResponse r : rows) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("inventory_no", r.inventoryNumber());
            row.put("created_at", fmt(r.createdAt()));
            row.put("store", blank(r.storeName()));
            row.put("lines", r.totalLines());
            row.put("diff_sum", r.totalDifference());
            row.put("user", blank(r.createdByName()));
            row.put("notes", blank(r.notes()));
            data.add(row);
        }
        return excelWriter.write(ExcelTemplate.STOCK_INVENTORIES, data);
    }

    @Override
    public byte[] exportTransfers(
        LocalDate from,
        LocalDate to,
        Integer fromStoreId,
        Integer toStoreId
    ) {
        List<StockTransferResponse> rows = stockTransferService
            .list(from, to, fromStoreId, toStoreId, Pageable.unpaged())
            .content();
        List<Map<String, Object>> data = new ArrayList<>();
        for (StockTransferResponse r : rows) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("transfer_no", r.transferNumber());
            row.put("created_at", fmt(r.createdAt()));
            row.put("from_store", r.fromStoreName());
            row.put("to_store", r.toStoreName());
            row.put("total_qty", r.totalQuantity());
            row.put("user", blank(r.createdByName()));
            row.put("notes", blank(r.notes()));
            data.add(row);
        }
        return excelWriter.write(ExcelTemplate.STOCK_TRANSFERS, data);
    }

    private List<Map<String, Object>> movementRows(List<StockMovementRowResponse> rows) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (StockMovementRowResponse m : rows) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("created_at", fmt(m.createdAt()));
            row.put("product_name", m.productName());
            row.put("sku", m.sku());
            row.put("quantity", m.quantity());
            row.put("store", blank(m.storeName()));
            row.put("user", blank(m.createdByName()));
            row.put("notes", blank(m.notes()));
            row.put("doc_no", blank(m.receiptNumber()));
            data.add(row);
        }
        return data;
    }

    private static String fmt(Instant instant) {
        return instant != null ? DT.format(instant) : "";
    }

    private static String trimSearch(String search) {
        return StringUtils.hasText(search) ? search.trim() : "";
    }

    private static String blank(String s) {
        return s != null ? s : "";
    }
}
