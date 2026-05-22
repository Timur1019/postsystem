package com.pos.service.stock.impl;

import com.pos.domain.StockMovementType;
import com.pos.dto.report.sales.CategorySalesRowResponse;
import com.pos.dto.report.sales.ProductSalesRowResponse;
import com.pos.dto.report.sales.StoreSalesRowResponse;
import com.pos.dto.report.stock.DeadStockRowResponse;
import com.pos.dto.report.stock.LowStockRowResponse;
import com.pos.dto.report.stock.StockBalanceRowResponse;
import com.pos.dto.report.stock.StockDashboardDayPoint;
import com.pos.dto.report.stock.StockDashboardResponse;
import com.pos.dto.report.stock.StockMovementRowResponse;
import com.pos.dto.report.stock.StockTurnoverRowResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.warehouse.StockReceiptResponse;
import com.pos.entity.Product;
import com.pos.entity.StockMovement;
import com.pos.entity.StockReceipt;
import com.pos.repository.ProductRepository;
import com.pos.repository.SaleItemRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.repository.StockReceiptRepository;
import com.pos.service.stock.StockReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockReportServiceImpl implements StockReportService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockMovementRepository stockMovementRepository;
    private final SaleItemRepository saleItemRepository;
    private final ProductRepository productRepository;
    private final StockReceiptRepository stockReceiptRepository;

    @Override
    public StockDashboardResponse dashboard(LocalDate from, LocalDate to, Integer storeId) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();

        long receivedUnits = positiveSum(
            stockMovementRepository.sumQuantityByTypeBetween(StockMovementType.RESTOCK, start, end, storeId)
        );
        long writeOffUnits = absUnits(
            stockMovementRepository.sumQuantityByTypeBetween(StockMovementType.WRITE_OFF, start, end, storeId)
        );
        BigDecimal receivedCost = nz(stockMovementRepository.sumRestockCostBetween(start, end, storeId));
        BigDecimal writeOffCost = nz(stockMovementRepository.sumWriteOffCostBetween(start, end, storeId));

        long soldUnits = 0;
        for (Object[] row : saleItemRepository.dailySoldUnitsAggregates(start, end, storeId)) {
            soldUnits += ((Number) row[1]).longValue();
        }

        Object[] stockTotals = unwrapAggregateRow(productRepository.sumActiveStockUnitsAndCost());
        long currentUnits = toLong(stockTotals[0]);
        BigDecimal currentCost = toBigDecimal(stockTotals[1]);

        long lowStockCount = productRepository.countLowStock();

        List<StockDashboardDayPoint> daily = mergeDailyBreakdown(
            from, to,
            stockMovementRepository.dailyStockMovementAggregates(start, end, storeId),
            saleItemRepository.dailySoldUnitsAggregates(start, end, storeId)
        );

        return new StockDashboardResponse(
            receivedUnits,
            receivedCost,
            soldUnits,
            writeOffUnits,
            writeOffCost,
            currentUnits,
            nz(currentCost),
            lowStockCount,
            daily
        );
    }

    @Override
    public PageResponse<ProductSalesRowResponse> productSales(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Integer categoryId,
        String search,
        Pageable pageable
    ) {
        String q = StringUtils.hasText(search) ? search.trim() : "";
        Page<Object[]> page = productRepository.productSalesReportPage(
            from, to, storeId, categoryId, q, pageable
        );
        return PageResponse.from(page.map(this::toProductSalesRow));
    }

    @Override
    public PageResponse<LowStockRowResponse> lowStock(Pageable pageable) {
        Page<Product> page = productRepository.findLowStockPage(pageable);
        return PageResponse.from(page.map(this::toLowStockRow));
    }

    @Override
    public PageResponse<StockTurnoverRowResponse> turnover(
        LocalDate from,
        LocalDate to,
        Integer categoryId,
        String search,
        Pageable pageable
    ) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        String q = StringUtils.hasText(search) ? search.trim() : "";
        Page<Object[]> page = productRepository.stockTurnoverPage(start, end, categoryId, q, pageable);
        return PageResponse.from(page.map(this::toTurnoverRow));
    }

    @Override
    public PageResponse<StockMovementRowResponse> movementJournal(
        LocalDate from,
        LocalDate to,
        String movementType,
        Integer storeId,
        String search,
        Pageable pageable
    ) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        String type = StringUtils.hasText(movementType) && !"ALL".equalsIgnoreCase(movementType)
            ? movementType.trim().toUpperCase()
            : null;
        String q = StringUtils.hasText(search) ? search.trim() : "";
        Page<StockMovement> page = stockMovementRepository.findMovementJournal(
            start, end, type, storeId, q, pageable
        );
        Map<UUID, String> receiptNumbers = loadReceiptNumbers(page.getContent());
        return PageResponse.from(page.map(m -> toMovementRow(m, receiptNumbers)));
    }

    @Override
    public PageResponse<StockReceiptResponse> receipts(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    ) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Page<StockReceipt> page = stockReceiptRepository.findReceiptsBetween(start, end, storeId, pageable);
        return PageResponse.from(page.map(this::toReceiptSummary));
    }

    @Override
    public PageResponse<CategorySalesRowResponse> categorySales(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    ) {
        Page<Object[]> page = productRepository.categorySalesReportPage(from, to, storeId, pageable);
        return PageResponse.from(page.map(this::toCategorySalesRow));
    }

    @Override
    public PageResponse<StoreSalesRowResponse> storeSales(
        LocalDate from,
        LocalDate to,
        Pageable pageable
    ) {
        Page<Object[]> page = productRepository.storeSalesReportPage(from, to, pageable);
        return PageResponse.from(page.map(this::toStoreSalesRow));
    }

    @Override
    public PageResponse<DeadStockRowResponse> deadStock(
        LocalDate asOfDate,
        int daysNoSale,
        Integer categoryId,
        String search,
        Pageable pageable
    ) {
        LocalDate asOf = asOfDate != null ? asOfDate : LocalDate.now(ZONE);
        int days = Math.max(1, daysNoSale);
        LocalDate cutoff = asOf.minusDays(days);
        String q = StringUtils.hasText(search) ? search.trim() : "";
        Page<Object[]> page = productRepository.deadStockPage(asOf, cutoff, days, categoryId, q, pageable);
        return PageResponse.from(page.map(row -> toDeadStockRow(row, asOf)));
    }

    @Override
    public PageResponse<StockBalanceRowResponse> stockBalances(
        Integer categoryId,
        String search,
        boolean onlyWithStock,
        Pageable pageable
    ) {
        String q = StringUtils.hasText(search) ? search.trim() : "";
        Page<Product> page = productRepository.stockBalancesPage(categoryId, q, onlyWithStock, pageable);
        return PageResponse.from(page.map(this::toBalanceRow));
    }

    private Map<UUID, String> loadReceiptNumbers(List<StockMovement> movements) {
        Set<UUID> ids = movements.stream()
            .map(StockMovement::getReferenceId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return stockReceiptRepository.findAllById(ids).stream()
            .collect(Collectors.toMap(StockReceipt::getId, StockReceipt::getReceiptNumber));
    }

    private StockTurnoverRowResponse toTurnoverRow(Object[] row) {
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

    private StockMovementRowResponse toMovementRow(StockMovement m, Map<UUID, String> receiptNumbers) {
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

    private StockReceiptResponse toReceiptSummary(StockReceipt r) {
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

    private long longVal(Object v) {
        if (v == null) {
            return 0L;
        }
        return ((Number) v).longValue();
    }

    private List<StockDashboardDayPoint> mergeDailyBreakdown(
        LocalDate from,
        LocalDate to,
        List<Object[]> stockRows,
        List<Object[]> soldRows
    ) {
        Map<String, long[]> byDay = new HashMap<>();
        for (Object[] row : stockRows) {
            String day = row[0].toString();
            long received = ((Number) row[1]).longValue();
            long writeOff = ((Number) row[2]).longValue();
            byDay.put(day, new long[] { received, 0, writeOff });
        }
        for (Object[] row : soldRows) {
            String day = row[0].toString();
            long sold = ((Number) row[1]).longValue();
            byDay.compute(day, (k, v) -> {
                if (v == null) {
                    return new long[] { 0, sold, 0 };
                }
                v[1] = sold;
                return v;
            });
        }
        List<StockDashboardDayPoint> out = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            String key = d.toString();
            long[] vals = byDay.getOrDefault(key, new long[] { 0, 0, 0 });
            out.add(new StockDashboardDayPoint(key, vals[0], vals[1], vals[2]));
        }
        return out;
    }

    private ProductSalesRowResponse toProductSalesRow(Object[] row) {
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

    private CategorySalesRowResponse toCategorySalesRow(Object[] row) {
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

    private StoreSalesRowResponse toStoreSalesRow(Object[] row) {
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

    private DeadStockRowResponse toDeadStockRow(Object[] row, LocalDate asOf) {
        UUID productId = UUID.fromString((String) row[0]);
        String name = (String) row[1];
        String sku = (String) row[2];
        String barcode = (String) row[3];
        String category = (String) row[4];
        int stockQty = ((Number) row[5]).intValue();
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

    private StockBalanceRowResponse toBalanceRow(Product p) {
        BigDecimal stockValue = p.getCostPrice()
            .multiply(BigDecimal.valueOf(p.getStockQuantity()))
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

    private LowStockRowResponse toLowStockRow(Product p) {
        int deficit = Math.max(0, p.getLowStockAlert() - p.getStockQuantity());
        BigDecimal stockValue = p.getCostPrice()
            .multiply(BigDecimal.valueOf(p.getStockQuantity()))
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

    /** Hibernate/Spring Data иногда возвращают вложенные Object[] для multi-column aggregate. */
    private static Object[] unwrapAggregateRow(Object raw) {
        if (raw == null) {
            return new Object[] { 0L, BigDecimal.ZERO };
        }
        Object[] row = raw instanceof Object[] arr ? arr : new Object[] { raw };
        while (row.length == 1 && row[0] instanceof Object[] nested) {
            row = nested;
        }
        Object[] flat = new Object[row.length];
        for (int i = 0; i < row.length; i++) {
            flat[i] = unwrapAggregateCell(row[i]);
        }
        return flat;
    }

    private static Object unwrapAggregateCell(Object cell) {
        Object v = cell;
        while (v instanceof Object[] nested && nested.length == 1) {
            v = nested[0];
        }
        return v;
    }

    private long toLong(Object value) {
        value = unwrapAggregateCell(value);
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        return Long.parseLong(value.toString());
    }

    private long positiveSum(long raw) {
        return raw > 0 ? raw : 0;
    }

    private long absUnits(long raw) {
        return raw < 0 ? -raw : raw;
    }

    private BigDecimal nz(BigDecimal v) {
        return v != null ? v.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    private BigDecimal toBigDecimal(Object v) {
        v = unwrapAggregateCell(v);
        if (v == null) {
            return BigDecimal.ZERO;
        }
        if (v instanceof BigDecimal bd) {
            return bd.setScale(2, RoundingMode.HALF_UP);
        }
        if (v instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue()).setScale(2, RoundingMode.HALF_UP);
        }
        return new BigDecimal(v.toString()).setScale(2, RoundingMode.HALF_UP);
    }
}
