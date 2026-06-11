package com.pos.finance.dto.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CashFlowReportDto(
    LocalDate from,
    LocalDate to,
    BigDecimal totalInflows,
    BigDecimal totalOutflows,
    BigDecimal netCashFlow,
    BigDecimal totalTransfers,
    List<CashFlowDailyDto> daily
) {}
