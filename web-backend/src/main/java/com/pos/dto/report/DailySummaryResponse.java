package com.pos.dto.report;

import java.math.BigDecimal;

public record DailySummaryResponse(
    BigDecimal totalRevenue,
    long transactionCount,
    long itemsSold
) {}
