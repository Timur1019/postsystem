package com.pos.service.export;

import java.time.LocalDate;

public interface SaleExportService {

    byte[] exportSoldLinesExcel(
        LocalDate from,
        LocalDate to,
        String cashierId,
        String search,
        String receiptNumber,
        String saleIdStr,
        String cashierName,
        String paymentMethodStr,
        String statusStr,
        String paymentSettlement,
        String storeIdStr
    );
}
