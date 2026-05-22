package com.pos.service;

import com.pos.dto.report.CashierStat;
import com.pos.dto.report.DailySummaryResponse;
import com.pos.dto.report.SalesReportResponse;
import com.pos.dto.report.TopProductRow;
import com.pos.dto.report.sales.PeriodCompareResponse;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {

    DailySummaryResponse getDailySummary(LocalDate date);

    SalesReportResponse getSalesReport(LocalDate from, LocalDate to);

    List<TopProductRow> getTopProducts(int limit, LocalDate from, LocalDate to);

    List<CashierStat> getCashierPerformance(LocalDate from, LocalDate to);

    PeriodCompareResponse getPeriodCompare(LocalDate from, LocalDate to, Integer storeId);
}
