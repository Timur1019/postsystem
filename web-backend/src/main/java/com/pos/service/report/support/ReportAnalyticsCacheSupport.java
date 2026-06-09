package com.pos.service.report.support;

import com.pos.cache.analytics.ReportAnalyticsSnapshot;
import com.pos.dto.report.CashierStat;
import com.pos.dto.report.TopProductRow;
import com.pos.service.cache.support.PosCacheWindowSupport;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class ReportAnalyticsCacheSupport {

    public List<TopProductRow> resolveTopProducts(
        ReportAnalyticsSnapshot snapshot,
        LocalDate from,
        LocalDate to
    ) {
        if (isFullWindowQuery(snapshot, from, to)) {
            return snapshot.topProductsWindow();
        }
        if (PosCacheWindowSupport.isLastCalendarDays(from, to, snapshot.windowEnd(), 7)) {
            return snapshot.topProductsLast7Days();
        }
        if (PosCacheWindowSupport.isLastCalendarDays(from, to, snapshot.windowEnd(), 30)) {
            return snapshot.topProductsLast30Days();
        }
        return null;
    }

    public List<CashierStat> resolveCashierStats(
        ReportAnalyticsSnapshot snapshot,
        LocalDate from,
        LocalDate to
    ) {
        if (isFullWindowQuery(snapshot, from, to)) {
            return snapshot.cashierStatsWindow();
        }
        if (PosCacheWindowSupport.isLastCalendarDays(from, to, snapshot.windowEnd(), 30)) {
            return snapshot.cashierStatsLast30Days();
        }
        return null;
    }

    private static boolean isFullWindowQuery(ReportAnalyticsSnapshot snapshot, LocalDate from, LocalDate to) {
        return from.equals(snapshot.windowStart()) && to.equals(snapshot.windowEnd());
    }
}
