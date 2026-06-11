package com.pos.finance.service.impl;

import com.pos.finance.dto.audit.FinanceAuditLogDto;
import com.pos.finance.dto.report.CashFlowDailyDto;
import com.pos.finance.dto.report.CashFlowReportDto;
import com.pos.finance.dto.report.ProfitLossLineDto;
import com.pos.finance.dto.report.ProfitLossReportDto;
import com.pos.finance.entity.FinanceAuditEntityType;
import com.pos.finance.service.FinanceAuditService;
import com.pos.finance.service.FinanceExportService;
import com.pos.finance.service.ReportService;
import com.pos.finance.util.FinanceExcelWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinanceExportServiceImpl implements FinanceExportService {

    private final ReportService reportService;
    private final FinanceAuditService auditService;

    @Override
    public byte[] exportProfitLoss(LocalDate from, LocalDate to, Integer storeId) {
        ProfitLossReportDto report = reportService.profitLoss(from, to, storeId);
        List<List<Object>> rows = new ArrayList<>();
        rows.add(List.of("Доходы", report.totalIncome()));
        rows.add(List.of("Расходы", report.totalExpense()));
        rows.add(List.of("Чистая прибыль", report.netProfit()));
        rows.add(List.of("", ""));
        rows.add(List.of("Расходы по категориям", ""));
        for (ProfitLossLineDto line : report.expenseByCategory()) {
            rows.add(List.of(line.name(), line.amount()));
        }
        return FinanceExcelWriter.write(
            "P&L",
            List.of("Показатель", "Сумма"),
            rows
        );
    }

    @Override
    public byte[] exportCashFlow(LocalDate from, LocalDate to, Integer storeId) {
        CashFlowReportDto report = reportService.cashFlow(from, to, storeId);
        List<List<Object>> rows = new ArrayList<>();
        rows.add(List.of("Приток", report.totalInflows()));
        rows.add(List.of("Отток", report.totalOutflows()));
        rows.add(List.of("Чистый поток", report.netCashFlow()));
        rows.add(List.of("Переводы между счетами", report.totalTransfers()));
        rows.add(List.of("", "", "", ""));
        rows.add(List.of("Дата", "Приток", "Отток", "Чистый поток"));
        for (CashFlowDailyDto day : report.daily()) {
            rows.add(List.of(day.date(), day.inflows(), day.outflows(), day.net()));
        }
        return FinanceExcelWriter.write(
            "CashFlow",
            List.of("Показатель", "Сумма", "", ""),
            rows
        );
    }

    @Override
    public byte[] exportAudit(FinanceAuditEntityType entityType, LocalDate from, LocalDate to) {
        List<FinanceAuditLogDto> logs = auditService
            .list(entityType, from, to, PageRequest.of(0, 5000))
            .content();
        List<List<Object>> rows = logs.stream()
            .map(log -> List.<Object>of(
                log.createdAt(),
                log.entityType(),
                log.action(),
                log.summary(),
                log.actorId()
            ))
            .toList();
        return FinanceExcelWriter.write(
            "Audit",
            List.of("Дата", "Тип", "Действие", "Описание", "Пользователь"),
            rows
        );
    }
}
