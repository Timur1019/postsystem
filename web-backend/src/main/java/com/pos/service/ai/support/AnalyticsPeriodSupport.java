package com.pos.service.ai.support;

import com.pos.util.TashkentPeriod;

import java.time.Instant;
import java.time.LocalDate;

public final class AnalyticsPeriodSupport {

    public static final java.time.ZoneId ZONE = TashkentPeriod.ZONE;

    private AnalyticsPeriodSupport() {
    }

    public record Period(LocalDate from, LocalDate to, Instant start, Instant end) {
    }

    public static Period period(LocalDate from, LocalDate to, int defaultDaysBack) {
        LocalDate safeTo = to != null ? to : TashkentPeriod.today();
        LocalDate safeFrom = from != null ? from : safeTo.minusDays(defaultDaysBack);
        TashkentPeriod.InstantRange range = TashkentPeriod.dayRange(safeFrom, safeTo);
        return new Period(safeFrom, safeTo, range.startInclusive(), range.endExclusive());
    }

    public static LocalDate today() {
        return TashkentPeriod.today();
    }
}
