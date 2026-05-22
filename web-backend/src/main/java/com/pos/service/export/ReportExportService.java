package com.pos.service.export;

import java.time.LocalDate;

public interface ReportExportService {

    byte[] exportSalesByProducts(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Integer categoryId,
        String search
    );

    byte[] exportSalesByCategories(LocalDate from, LocalDate to, Integer storeId);

    byte[] exportSalesByStores(LocalDate from, LocalDate to);

    byte[] exportPeriodCompare(LocalDate from, LocalDate to, Integer storeId);

    byte[] exportDailySummary(LocalDate date);

    byte[] exportCashierPerformance(LocalDate from, LocalDate to);

    byte[] exportStockBalances(Integer categoryId, String search, boolean onlyWithStock);

    byte[] exportDeadStock(LocalDate asOfDate, int daysNoSale, Integer categoryId, String search);

    byte[] exportAdjustments(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        String search
    );

    byte[] exportInventories(LocalDate from, LocalDate to, Integer storeId);

    byte[] exportTransfers(
        LocalDate from,
        LocalDate to,
        Integer fromStoreId,
        Integer toStoreId
    );
}
