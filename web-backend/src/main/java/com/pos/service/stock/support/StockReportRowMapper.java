package com.pos.service.stock.support;

import com.pos.dto.report.sales.CategorySalesRowResponse;
import com.pos.dto.report.sales.ProductSalesRowResponse;
import com.pos.dto.report.sales.StoreSalesRowResponse;
import com.pos.dto.report.stock.DeadStockRowResponse;
import com.pos.dto.report.stock.LowStockRowResponse;
import com.pos.dto.report.stock.StockBalanceRowResponse;
import com.pos.dto.report.stock.StockMovementRowResponse;
import com.pos.dto.report.stock.StockTurnoverRowResponse;
import com.pos.dto.warehouse.StockReceiptResponse;
import com.pos.entity.Product;
import com.pos.entity.StockMovement;
import com.pos.entity.StockReceipt;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.pos.service.stock.support.StockReportAggregateSupport.longVal;
import static com.pos.service.stock.support.StockReportAggregateSupport.toBigDecimal;

@Component
public class StockReportRowMapper {

    public StockTurnoverRowResponse toTurnoverRow(Object[] row) {
        return new StockTurnoverRowResponse(
            UUID.fromString((String) row[0]),
            (String) row[1],
            (String) row[2],
            (String) row[3],
            longVal(row[4]),
            longVal(row[5]),
            longVal(row[6]),
            longVal(row[7]),
            longVal(row[8]),
            longVal(row[9]),
            longVal(row[10]),
            toBigDecimal(row[11])
        );
    }

    public StockMovementRowResponse toMovementRow(StockMovement m, Map<UUID, String> receiptNumbers) {
        String receiptNumber = m.getReferenceId() != null
            ? receiptNumbers.get(m.getReferenceId())
            : null;
        return new StockMovementRowResponse(
            m.getId(),
            m.getCreatedAt(),
            m.getMovementType(),
            m.getProduct().getId(),
            m.getProduct().getName(),
            m.getProduct().getSku(),
            m.getQuantity(),
            m.getNotes(),
            m.getWriteOffReason(),
            m.getStore() != null ? m.getStore().getId() : null,
            m.getStore() != null ? m.getStore().getName() : null,
            m.getCreatedBy() != null ? m.getCreatedBy().getFullName() : null,
            m.getReferenceId(),
            receiptNumber
        );
    }

    public StockReceiptResponse toReceiptSummary(StockReceipt r) {
        return new StockReceiptResponse(
            r.getId(),
            r.getReceiptNumber(),
            r.getSupplier() != null ? r.getSupplier().getId() : null,
            r.getSupplier() != null ? r.getSupplier().getName() : null,
            r.getStore() != null ? r.getStore().getId() : null,
            r.getStore() != null ? r.getStore().getName() : null,
            r.getNotes(),
            r.getTotalQuantity(),
            r.getTotalCost(),
            r.getCreatedBy() != null ? r.getCreatedBy().getFullName() : null,
            r.getCreatedAt(),
            List.of()
        );
    }

    public ProductSalesRowResponse toProductSalesRow(Object[] row) {
        UUID productId = UUID.fromString((String) row[0]);
        String name = (String) row[1];
        String sku = (String) row[2];
        String barcode = (String) row[3];
        String category = (String) row[4];
        long netQty = ((Number) row[5]).longValue();
        long returnedQty = ((Number) row[6]).longValue();
        BigDecimal revenue = toBigDecimal(row[7]);
        BigDecimal cost = toBigDecimal(row[8]);
        long soldQty = netQty + returnedQty;
        BigDecimal margin = revenue.subtract(cost).setScale(2, RoundingMode.HALF_UP);
        return new ProductSalesRowResponse(
            productId,
            name,
            sku,
            barcode,
            category,
            soldQty,
            returnedQty,
            netQty,
            revenue,
            cost,
            margin
        );
    }

    public CategorySalesRowResponse toCategorySalesRow(Object[] row) {
        Integer categoryId = row[0] != null ? ((Number) row[0]).intValue() : null;
        String categoryName = (String) row[1];
        long receiptCount = longVal(row[2]);
        long netQty = longVal(row[3]);
        long returnedQty = longVal(row[4]);
        BigDecimal revenue = toBigDecimal(row[5]);
        BigDecimal cost = toBigDecimal(row[6]);
        BigDecimal margin = revenue.subtract(cost).setScale(2, RoundingMode.HALF_UP);
        return new CategorySalesRowResponse(
            categoryId,
            categoryName,
            receiptCount,
            netQty,
            returnedQty,
            revenue,
            cost,
            margin
        );
    }

    public StoreSalesRowResponse toStoreSalesRow(Object[] row) {
        Integer storeId = ((Number) row[0]).intValue();
        String storeName = (String) row[1];
        long receiptCount = longVal(row[2]);
        long netQty = longVal(row[3]);
        long returnedQty = longVal(row[4]);
        BigDecimal revenue = toBigDecimal(row[5]);
        BigDecimal cost = toBigDecimal(row[6]);
        BigDecimal margin = revenue.subtract(cost).setScale(2, RoundingMode.HALF_UP);
        return new StoreSalesRowResponse(
            storeId,
            storeName,
            receiptCount,
            netQty,
            returnedQty,
            revenue,
            cost,
            margin
        );
    }

    public DeadStockRowResponse toDeadStockRow(Object[] row, LocalDate asOf) {
        UUID productId = UUID.fromString((String) row[0]);
        String name = (String) row[1];
        String sku = (String) row[2];
        String barcode = (String) row[3];
        String category = (String) row[4];
        BigDecimal stockQty = toBigDecimal(row[5]);
        BigDecimal stockValue = toBigDecimal(row[6]);
        LocalDate lastSale = row[7] != null ? LocalDate.parse(row[7].toString()) : null;
        int daysWithout = lastSale != null
            ? (int) ChronoUnit.DAYS.between(lastSale, asOf)
            : ((Number) row[8]).intValue();
        return new DeadStockRowResponse(
            productId,
            name,
            sku,
            barcode,
            category,
            stockQty,
            stockValue,
            lastSale,
            daysWithout
        );
    }

    public StockBalanceRowResponse toBalanceRow(Product p) {
        BigDecimal stockValue = p.getCostPrice()
            .multiply(p.getStockQuantity())
            .setScale(2, RoundingMode.HALF_UP);
        return new StockBalanceRowResponse(
            p.getId(),
            p.getName(),
            p.getSku(),
            p.getBarcode(),
            p.getCategory() != null ? p.getCategory().getName() : "",
            p.getStockQuantity(),
            p.getLowStockAlert(),
            p.getCostPrice(),
            stockValue
        );
    }

    public LowStockRowResponse toLowStockRow(Product p) {
        BigDecimal alert = BigDecimal.valueOf(p.getLowStockAlert());
        BigDecimal deficit = alert.subtract(p.getStockQuantity()).max(BigDecimal.ZERO);
        BigDecimal stockValue = p.getCostPrice()
            .multiply(p.getStockQuantity())
            .setScale(2, RoundingMode.HALF_UP);
        return new LowStockRowResponse(
            p.getId(),
            p.getName(),
            p.getSku(),
            p.getBarcode(),
            p.getStockQuantity(),
            p.getLowStockAlert(),
            deficit,
            p.getCostPrice(),
            stockValue
        );
    }
}
