package com.pos.service.cache.support;

import com.pos.config.PosCacheProperties;

import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Общее скользящее окно для кэшей отчётов (аналитика, журнал продаж).
 */
public final class PosCacheWindowSupport {

    private PosCacheWindowSupport() {
    }

    public static LocalDate windowStart(PosCacheProperties props, ZoneId zone) {
        LocalDate today = LocalDate.now(zone);
        return today.minusMonths(props.getWindowMonths());
    }

    public static LocalDate windowEnd(ZoneId zone) {
        return LocalDate.now(zone);
    }

    public static LocalDate clampFrom(LocalDate from, LocalDate windowStart, LocalDate windowEnd) {
        if (from == null || from.isBefore(windowStart)) {
            return windowStart;
        }
        return from.isAfter(windowEnd) ? windowEnd : from;
    }

    public static LocalDate clampTo(LocalDate to, LocalDate windowStart, LocalDate windowEnd) {
        if (to == null || to.isAfter(windowEnd)) {
            return windowEnd;
        }
        return to.isBefore(windowStart) ? windowStart : to;
    }

    /** Последние N календарных дней, включая {@code rangeEnd} (N=7 → 7 дней). */
    public static boolean isLastCalendarDays(LocalDate from, LocalDate to, LocalDate rangeEnd, int days) {
        if (from == null || to == null || rangeEnd == null || days < 1) {
            return false;
        }
        return to.equals(rangeEnd) && from.equals(rangeEnd.minusDays(days - 1L));
    }
}
