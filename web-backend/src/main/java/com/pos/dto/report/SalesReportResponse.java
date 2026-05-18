package com.pos.dto.report;

import java.math.BigDecimal;
import java.util.List;

public record SalesReportResponse(
    BigDecimal totalRevenue,
    long transactionCount,
    long totalItemsSold,
    BigDecimal averageTransactionValue,
    List<DailyPoint> dailyBreakdown
) {}
