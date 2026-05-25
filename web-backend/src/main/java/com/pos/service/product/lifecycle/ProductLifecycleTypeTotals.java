package com.pos.service.product.lifecycle;

import com.pos.domain.StockMovementType;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.function.LongUnaryOperator;

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

    public static ProductLifecycleTypeTotals fromRows(List<Object[]> rows) {
        Map<Bucket, Long> totals = new EnumMap<>(Bucket.class);
        for (Bucket bucket : Bucket.values()) {
            totals.put(bucket, 0L);
        }
        for (Object[] row : rows) {
            String type = (String) row[0];
            long sum = ((Number) row[1]).longValue();
            Bucket bucket = Bucket.byMovementType(type);
            if (bucket == null) {
                continue;
            }
            totals.merge(bucket, bucket.normalize.applyAsLong(sum), Long::sum);
        }
        return new ProductLifecycleTypeTotals(
            totals.get(Bucket.RESTOCK),
            totals.get(Bucket.SALE),
            totals.get(Bucket.RETURN),
            totals.get(Bucket.WRITE_OFF),
            totals.get(Bucket.ADJUSTMENT)
        );
    }

    private enum Bucket {
        RESTOCK(StockMovementType.RESTOCK, v -> Math.max(0, v)),
        SALE(StockMovementType.SALE, v -> v < 0 ? -v : v),
        RETURN(StockMovementType.RETURN, v -> Math.max(0, v)),
        WRITE_OFF(StockMovementType.WRITE_OFF, v -> v < 0 ? -v : v),
        ADJUSTMENT(StockMovementType.ADJUSTMENT, v -> v);

        private final String movementType;
        private final LongUnaryOperator normalize;

        Bucket(String movementType, LongUnaryOperator normalize) {
            this.movementType = movementType;
            this.normalize = normalize;
        }

        static Bucket byMovementType(String type) {
            for (Bucket bucket : values()) {
                if (bucket.movementType.equals(type)) {
                    return bucket;
                }
            }
            return null;
        }
    }
}
