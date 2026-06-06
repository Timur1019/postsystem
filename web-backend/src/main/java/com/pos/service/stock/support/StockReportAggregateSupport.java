package com.pos.service.stock.support;

import com.pos.dto.report.stock.StockDashboardDayPoint;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class StockReportAggregateSupport {

    private StockReportAggregateSupport() {
    }

    public static List<StockDashboardDayPoint> mergeDailyBreakdown(
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

    public static Object[] unwrapAggregateRow(Object raw) {
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

    public static Object unwrapAggregateCell(Object cell) {
        Object v = cell;
        while (v instanceof Object[] nested && nested.length == 1) {
            v = nested[0];
        }
        return v;
    }

    public static long toLong(Object value) {
        value = unwrapAggregateCell(value);
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        return Long.parseLong(value.toString());
    }

    public static long longVal(Object v) {
        if (v == null) {
            return 0L;
        }
        return ((Number) v).longValue();
    }

    public static long positiveSum(long raw) {
        return raw > 0 ? raw : 0;
    }

    public static long absUnits(long raw) {
        return raw < 0 ? -raw : raw;
    }

    public static BigDecimal nz(BigDecimal v) {
        return v != null ? v.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    public static BigDecimal toBigDecimal(Object v) {
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
