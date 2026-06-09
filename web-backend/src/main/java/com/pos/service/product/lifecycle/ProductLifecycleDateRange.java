package com.pos.service.product.lifecycle;

import com.pos.entity.Product;
import com.pos.exception.PosExceptions;

import com.pos.util.TashkentPeriod;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Нормализованный период для журнала жизненного цикла товара (Asia/Tashkent).
 */
public record ProductLifecycleDateRange(LocalDate from, LocalDate to, Instant startInclusive, Instant endExclusive) {

    public static final java.time.ZoneId ZONE = TashkentPeriod.ZONE;

    public static ProductLifecycleDateRange resolve(LocalDate from, LocalDate to, Product product) {
        LocalDate rangeFrom = from != null ? from : defaultFrom(product);
        LocalDate rangeTo = to != null ? to : TashkentPeriod.today();
        if (rangeFrom.isAfter(rangeTo)) {
            throw PosExceptions.badRequest(
                "Дата «с» не может быть позже даты «по»",
                java.util.Map.of("from", rangeFrom.toString(), "to", rangeTo.toString())
            );
        }
        TashkentPeriod.InstantRange range = TashkentPeriod.dayRange(rangeFrom, rangeTo);
        return new ProductLifecycleDateRange(rangeFrom, rangeTo, range.startInclusive(), range.endExclusive());
    }

    private static LocalDate defaultFrom(Product product) {
        if (product.getCreatedAt() != null) {
            return product.getCreatedAt().atZone(ZONE).toLocalDate();
        }
        return TashkentPeriod.today().minusYears(1);
    }
}
