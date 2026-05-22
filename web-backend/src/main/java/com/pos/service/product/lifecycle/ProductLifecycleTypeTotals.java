package com.pos.service.product.lifecycle;

import com.pos.domain.StockMovementType;

/**
 * Агрегаты количества по типам движения за период.
 */
public record ProductLifecycleTypeTotals(
    long restockUnits,
    long saleUnits,
    long returnUnits,
    long writeOffUnits,
    long adjustmentNetUnits
) {
    public static ProductLifecycleTypeTotals empty() {
        return new ProductLifecycleTypeTotals(0, 0, 0, 0, 0);
    }

    public static ProductLifecycleTypeTotals fromRows(java.util.List<Object[]> rows) {
        long restock = 0;
        long sale = 0;
        long returned = 0;
        long writeOff = 0;
        long adjustment = 0;

        for (Object[] row : rows) {
            String type = (String) row[0];
            long sum = ((Number) row[1]).longValue();
            if (StockMovementType.RESTOCK.equals(type)) {
                restock += positive(sum);
            } else if (StockMovementType.SALE.equals(type)) {
                sale += abs(sum);
            } else if (StockMovementType.RETURN.equals(type)) {
                returned += positive(sum);
            } else if (StockMovementType.WRITE_OFF.equals(type)) {
                writeOff += abs(sum);
            } else if (StockMovementType.ADJUSTMENT.equals(type)) {
                adjustment += sum;
            }
        }
        return new ProductLifecycleTypeTotals(restock, sale, returned, writeOff, adjustment);
    }

    private static long positive(long v) {
        return Math.max(0, v);
    }

    private static long abs(long v) {
        return v < 0 ? -v : v;
    }
}
