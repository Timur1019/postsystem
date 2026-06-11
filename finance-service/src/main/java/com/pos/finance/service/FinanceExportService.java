package com.pos.finance.service;

import com.pos.finance.entity.FinanceAuditEntityType;

import java.time.LocalDate;

public interface FinanceExportService {

    byte[] exportProfitLoss(LocalDate from, LocalDate to, Integer storeId);

    byte[] exportCashFlow(LocalDate from, LocalDate to, Integer storeId);

    byte[] exportAudit(FinanceAuditEntityType entityType, LocalDate from, LocalDate to);
}
