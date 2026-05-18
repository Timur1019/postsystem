package com.pos.service.analytics;

import com.pos.cache.analytics.DailySalesAggregate;
import com.pos.cache.analytics.ReportAnalyticsSnapshot;
import com.pos.dto.report.DailyPoint;
import com.pos.dto.report.DailySummaryResponse;
import com.pos.dto.report.SalesReportResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class ReportAnalyticsReadSupport {

    private ReportAnalyticsReadSupport() {
    }

    public static DailySummaryResponse dailySummary(ReportAnalyticsSnapshot snapshot, LocalDate date) {
        DailySalesAggregate day = snapshot.dailyByDate().get(date);
        if (day == null) {
            return new DailySummaryResponse(BigDecimal.ZERO, 0L, 0L);
        }
        return new DailySummaryResponse(day.revenue(), day.transactionCount(), day.itemsSold());
    }

    public static SalesReportResponse salesReport(ReportAnalyticsSnapshot snapshot, LocalDate from, LocalDate to) {
        Map<LocalDate, DailySalesAggregate> daily = snapshot.dailyByDate();
        List<DailyPoint> breakdown = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        long transactions = 0L;
        long itemsSold = 0L;

        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            DailySalesAggregate agg = daily.get(d);
            BigDecimal rev = agg != null ? agg.revenue() : BigDecimal.ZERO;
            if (agg != null) {
                transactions += agg.transactionCount();
                itemsSold += agg.itemsSold();
            }
            total = total.add(rev);
            breakdown.add(new DailyPoint(d.toString(), rev));
        }

        return new SalesReportResponse(
            total,
            transactions,
            itemsSold,
            averageValue(total, transactions),
            breakdown
        );
    }

    private static BigDecimal averageValue(BigDecimal total, long transactions) {
        if (transactions <= 0) {
            return BigDecimal.ZERO;
        }
        return total.divide(BigDecimal.valueOf(transactions), 2, RoundingMode.HALF_UP);
    }
}
