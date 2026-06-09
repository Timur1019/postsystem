package com.pos.util;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TashkentPeriodTest {

    @Test
    void dayRange_coversFullDays() {
        LocalDate from = LocalDate.of(2026, 5, 1);
        LocalDate to = LocalDate.of(2026, 5, 3);
        TashkentPeriod.InstantRange range = TashkentPeriod.dayRange(from, to);

        assertTrue(range.startInclusive().isBefore(range.endExclusive()));
        assertEquals(
            from.atStartOfDay(TashkentPeriod.ZONE).toInstant(),
            range.startInclusive()
        );
        assertEquals(
            to.plusDays(1).atStartOfDay(TashkentPeriod.ZONE).toInstant(),
            range.endExclusive()
        );
    }
}
