package com.pos.dto.report.stock;

import java.math.BigDecimal;
import java.util.List;

public record StockDashboardResponse(
    long receivedUnits,
    BigDecimal receivedCostEstimate,
    long soldUnits,
    long writeOffUnits,
    BigDecimal writeOffCostEstimate,
    long currentStockUnits,
    BigDecimal currentStockCostEstimate,
    long lowStockSkuCount,
    List<StockDashboardDayPoint> dailyBreakdown
) {}
