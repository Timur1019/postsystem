package com.pos.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Единый часовой пояс и диапазоны дат для отчётов и складских операций.
 */
public final class TashkentPeriod {

    public static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private TashkentPeriod() {
    }

    public record InstantRange(Instant startInclusive, Instant endExclusive) {
    }

    /** [from 00:00, to+1 00:00) в Asia/Tashkent. */
    public static InstantRange dayRange(LocalDate from, LocalDate to) {
        return new InstantRange(
            from.atStartOfDay(ZONE).toInstant(),
            to.plusDays(1).atStartOfDay(ZONE).toInstant()
        );
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }
}
