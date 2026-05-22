package com.pos.dto.report.sales;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PeriodCompareResponse(
    LocalDate currentFrom,
    LocalDate currentTo,
    LocalDate previousFrom,
    LocalDate previousTo,
    PeriodMetrics current,
    PeriodMetrics previous,
    PeriodDeltas deltas
) {
    public record PeriodMetrics(
        BigDecimal revenue,
        long receiptCount,
        long itemsSold
    ) {}

    public record PeriodDeltas(
        BigDecimal revenueDelta,
        BigDecimal revenueDeltaPercent,
        long receiptCountDelta,
        BigDecimal receiptCountDeltaPercent,
        long itemsSoldDelta,
        BigDecimal itemsSoldDeltaPercent
    ) {}
}
