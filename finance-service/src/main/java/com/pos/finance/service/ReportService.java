package com.pos.finance.service;

import com.pos.finance.dto.report.CashFlowReportDto;
import com.pos.finance.dto.report.ProfitLossReportDto;

import java.time.LocalDate;

public interface ReportService {

    ProfitLossReportDto profitLoss(LocalDate from, LocalDate to, Integer storeId);

    CashFlowReportDto cashFlow(LocalDate from, LocalDate to, Integer storeId);
}
