package com.pos.dto.report.stock;

public record StockDashboardDayPoint(
    String date,
    long receivedUnits,
    long soldUnits,
    long writeOffUnits
) {}
