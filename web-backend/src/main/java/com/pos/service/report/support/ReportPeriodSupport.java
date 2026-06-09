package com.pos.service.report.support;

import com.pos.config.PosCacheProperties;
import com.pos.service.cache.support.PosCacheWindowSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Component
@RequiredArgsConstructor
public class ReportPeriodSupport {

    private final PosCacheProperties cacheProperties;

    public record InstantRange(Instant startInclusive, Instant endExclusive) {
    }

    public ZoneId zone() {
        return ZoneId.of(cacheProperties.getZoneId());
    }

    public LocalDate today() {
        return LocalDate.now(zone());
    }

    public boolean isToday(LocalDate date) {
        return date != null && date.equals(today());
    }

    /** Кэш обновляется ночью; продажи за текущий день — только из БД. */
    public boolean rangeIncludesToday(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            return false;
        }
        LocalDate today = today();
        return !to.isBefore(today) && !from.isAfter(today);
    }

    public InstantRange dayRange(LocalDate from, LocalDate to) {
        ZoneId z = zone();
        return new InstantRange(
            from.atStartOfDay(z).toInstant(),
            to.plusDays(1).atStartOfDay(z).toInstant()
        );
    }

    public LocalDate clampFrom(LocalDate from) {
        ZoneId z = zone();
        LocalDate windowStart = PosCacheWindowSupport.windowStart(cacheProperties, z);
        LocalDate windowEnd = PosCacheWindowSupport.windowEnd(z);
        return PosCacheWindowSupport.clampFrom(from, windowStart, windowEnd);
    }

    public LocalDate clampTo(LocalDate to) {
        ZoneId z = zone();
        LocalDate windowStart = PosCacheWindowSupport.windowStart(cacheProperties, z);
        LocalDate windowEnd = PosCacheWindowSupport.windowEnd(z);
        return PosCacheWindowSupport.clampTo(to, windowStart, windowEnd);
    }
}
