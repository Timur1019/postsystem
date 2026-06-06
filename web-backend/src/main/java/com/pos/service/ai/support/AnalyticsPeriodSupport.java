package com.pos.service.ai.support;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

public final class AnalyticsPeriodSupport {

    public static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private AnalyticsPeriodSupport() {
    }

    public record Period(LocalDate from, LocalDate to, Instant start, Instant end) {
    }

    public static Period period(LocalDate from, LocalDate to, int defaultDaysBack) {
        LocalDate safeTo = to != null ? to : LocalDate.now(ZONE);
        LocalDate safeFrom = from != null ? from : safeTo.minusDays(defaultDaysBack);
        Instant start = safeFrom.atStartOfDay(ZONE).toInstant();
        Instant end = safeTo.plusDays(1).atStartOfDay(ZONE).toInstant();
        return new Period(safeFrom, safeTo, start, end);
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }
}
