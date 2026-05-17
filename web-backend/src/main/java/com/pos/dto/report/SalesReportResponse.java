package com.pos.dto.report;

import java.math.BigDecimal;
import java.util.List;

public record SalesReportResponse(
    BigDecimal totalRevenue,
    List<DailyPoint> dailyBreakdown
) {}
