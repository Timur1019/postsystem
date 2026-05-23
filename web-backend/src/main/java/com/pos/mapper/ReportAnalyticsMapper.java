package com.pos.mapper;

import com.pos.cache.analytics.DailySalesAggregate;
import org.mapstruct.Mapper;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Mapper(config = PosMapperConfig.class)
public interface ReportAnalyticsMapper {

    default BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        return new BigDecimal(value.toString());
    }

    default long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        return Long.parseLong(value.toString());
    }

    default LocalDate toLocalDate(Object value, ZoneId zone) {
        if (value instanceof LocalDate ld) {
            return ld;
        }
        if (value instanceof Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        if (value instanceof java.util.Date utilDate) {
            return utilDate.toInstant().atZone(zone).toLocalDate();
        }
        if (value instanceof Instant instant) {
            return instant.atZone(zone).toLocalDate();
        }
        throw new IllegalArgumentException("Unsupported date type in aggregate: " + value.getClass());
    }

    default DailySalesAggregate fromRevenueRow(Object[] row, ZoneId zone) {
        LocalDate day = toLocalDate(row[0], zone);
        BigDecimal revenue = toBigDecimal(row[1]);
        long txCount = toLong(row[2]);
        return new DailySalesAggregate(day, revenue, txCount, 0L, BigDecimal.ZERO);
    }

    default DailySalesAggregate fromItemsSoldRow(Object[] row, ZoneId zone) {
        LocalDate day = toLocalDate(row[0], zone);
        long items = toLong(row[1]);
        return new DailySalesAggregate(day, BigDecimal.ZERO, 0L, items, BigDecimal.ZERO);
    }

    default DailySalesAggregate fromCostEstimateRow(Object[] row, ZoneId zone) {
        LocalDate day = toLocalDate(row[0], zone);
        BigDecimal cost = toBigDecimal(row[1]);
        return new DailySalesAggregate(day, BigDecimal.ZERO, 0L, 0L, cost);
    }

    default DailySalesAggregate mergeItems(DailySalesAggregate existing, DailySalesAggregate incoming) {
        return new DailySalesAggregate(
            existing.day(),
            existing.revenue(),
            existing.transactionCount(),
            incoming.itemsSold(),
            existing.costEstimate()
        );
    }

    default DailySalesAggregate mergeCost(DailySalesAggregate existing, DailySalesAggregate incoming) {
        return new DailySalesAggregate(
            existing.day(),
            existing.revenue(),
            existing.transactionCount(),
            existing.itemsSold(),
            incoming.costEstimate()
        );
    }
}
