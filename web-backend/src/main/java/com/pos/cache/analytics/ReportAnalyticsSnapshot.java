package com.pos.cache.analytics;

import com.pos.dto.report.CashierStat;
import com.pos.dto.report.TopProductRow;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Неизменяемый снимок аналитики за скользящее окно (по умолчанию 2 месяца).
 */
public record ReportAnalyticsSnapshot(
    LocalDate windowStart,
    LocalDate windowEnd,
    Instant builtAt,
    Map<LocalDate, DailySalesAggregate> dailyByDate,
    List<TopProductRow> topProductsWindow,
    List<TopProductRow> topProductsLast7Days,
    List<TopProductRow> topProductsLast30Days,
    List<CashierStat> cashierStatsWindow,
    List<CashierStat> cashierStatsLast30Days
) {
    public boolean covers(LocalDate date) {
        return date != null && !date.isBefore(windowStart) && !date.isAfter(windowEnd);
    }

    public boolean coversRange(LocalDate from, LocalDate to) {
        return from != null && to != null && !from.isBefore(windowStart) && !to.isAfter(windowEnd);
    }
}
