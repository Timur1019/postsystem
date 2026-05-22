package com.pos.service.product.lifecycle;

import com.pos.entity.Product;
import com.pos.exception.PosExceptions;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Нормализованный период для журнала жизненного цикла товара (Asia/Tashkent).
 */
public record ProductLifecycleDateRange(LocalDate from, LocalDate to, Instant startInclusive, Instant endExclusive) {

    public static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    public static ProductLifecycleDateRange resolve(LocalDate from, LocalDate to, Product product) {
        LocalDate rangeFrom = from != null ? from : defaultFrom(product);
        LocalDate rangeTo = to != null ? to : LocalDate.now(ZONE);
        if (rangeFrom.isAfter(rangeTo)) {
            throw PosExceptions.badRequest(
                "Дата «с» не может быть позже даты «по»",
                java.util.Map.of("from", rangeFrom.toString(), "to", rangeTo.toString())
            );
        }
        Instant start = rangeFrom.atStartOfDay(ZONE).toInstant();
        Instant end = rangeTo.plusDays(1).atStartOfDay(ZONE).toInstant();
        return new ProductLifecycleDateRange(rangeFrom, rangeTo, start, end);
    }

    private static LocalDate defaultFrom(Product product) {
        if (product.getCreatedAt() != null) {
            return product.getCreatedAt().atZone(ZONE).toLocalDate();
        }
        return LocalDate.now(ZONE).minusYears(1);
    }
}
