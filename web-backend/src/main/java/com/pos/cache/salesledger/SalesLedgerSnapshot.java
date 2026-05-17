package com.pos.cache.salesledger;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

public record SalesLedgerSnapshot(
    LocalDate windowStart,
    LocalDate windowEnd,
    ZoneId zone,
    Instant builtAt,
    List<SalesLedgerEntry> entries
) {
    public boolean coversInstant(Instant instant) {
        if (instant == null) {
            return false;
        }
        Instant start = windowStart.atStartOfDay(zone).toInstant();
        Instant end = windowEnd.plusDays(1).atStartOfDay(zone).toInstant();
        return !instant.isBefore(start) && instant.isBefore(end);
    }
}
