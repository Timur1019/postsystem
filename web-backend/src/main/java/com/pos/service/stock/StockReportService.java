package com.pos.service.stock;

import com.pos.dto.report.sales.CategorySalesRowResponse;
import com.pos.dto.report.sales.ProductSalesRowResponse;
import com.pos.dto.report.sales.StoreSalesRowResponse;
import com.pos.dto.report.stock.DeadStockRowResponse;
import com.pos.dto.report.stock.LowStockRowResponse;
import com.pos.dto.report.stock.StockBalanceRowResponse;
import com.pos.dto.report.stock.StockDashboardResponse;
import com.pos.dto.report.stock.StockMovementRowResponse;
import com.pos.dto.report.stock.StockTurnoverRowResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.warehouse.StockReceiptResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface StockReportService {

    StockDashboardResponse dashboard(LocalDate from, LocalDate to, Integer storeId);

    PageResponse<ProductSalesRowResponse> productSales(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Integer categoryId,
        String search,
        Pageable pageable
    );

    PageResponse<LowStockRowResponse> lowStock(Pageable pageable);

    PageResponse<StockTurnoverRowResponse> turnover(
        LocalDate from,
        LocalDate to,
        Integer categoryId,
        String search,
        Pageable pageable
    );

    PageResponse<StockMovementRowResponse> movementJournal(
        LocalDate from,
        LocalDate to,
        String movementType,
        Integer storeId,
        String search,
        Pageable pageable
    );

    PageResponse<StockReceiptResponse> receipts(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    );

    PageResponse<CategorySalesRowResponse> categorySales(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    );

    PageResponse<StoreSalesRowResponse> storeSales(
        LocalDate from,
        LocalDate to,
        Pageable pageable
    );

    PageResponse<DeadStockRowResponse> deadStock(
        LocalDate asOfDate,
        int daysNoSale,
        Integer categoryId,
        String search,
        Pageable pageable
    );

    PageResponse<StockBalanceRowResponse> stockBalances(
        Integer categoryId,
        String search,
        boolean onlyWithStock,
        Pageable pageable
    );
}
