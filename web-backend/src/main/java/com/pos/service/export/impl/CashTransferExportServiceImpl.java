package com.pos.service.export.impl;

import com.pos.dto.cashregister.CashTransferRowResponse;
import com.pos.service.CashTransferService;
import com.pos.service.export.CashTransferExportService;
import com.pos.spreadsheet.ExcelSpreadsheetWriter;
import com.pos.spreadsheet.ExcelTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CashTransferExportServiceImpl implements CashTransferExportService {

    private static final ZoneId TZ = ZoneId.of("Asia/Tashkent");
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(TZ);

    private final CashTransferService cashTransferService;
    private final ExcelSpreadsheetWriter excelWriter;

    @Override
    public byte[] exportTransfersExcel(
        String storeSearch,
        Integer registerNumber,
        LocalDate closedFrom,
        LocalDate closedTo
    ) {
        List<CashTransferRowResponse> rows = cashTransferService.listAll(
            storeSearch,
            registerNumber,
            closedFrom,
            closedTo
        );

        List<Map<String, Object>> excelRows = new ArrayList<>();
        for (CashTransferRowResponse r : rows) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("store_name", r.storeName() != null ? r.storeName() : "");
            row.put("register_number", r.registerNumber() != null ? r.registerNumber() : "");
            row.put("opened_at", r.openedAt() != null ? DT.format(r.openedAt()) : "");
            row.put("closed_at", r.closedAt() != null ? DT.format(r.closedAt()) : "");
            row.put("cashier_name", r.cashierName() != null ? r.cashierName() : "");
            row.put("sales_count", r.salesCount());
            row.put("total_amount", r.totalAmount());
            row.put("payment_cash", r.paymentCash());
            row.put("payment_card", r.paymentCard());
            row.put("payment_non_cash", r.paymentNonCash());
            row.put("returns_count", r.returnsCount());
            row.put("returns_total", r.returnsTotalAmount());
            row.put("returns_cash", r.returnsCash());
            row.put("returns_card", r.returnsCard());
            row.put("returns_non_cash", r.returnsNonCash());
            excelRows.add(row);
        }

        return excelWriter.write(ExcelTemplate.CASH_TRANSFER_JOURNAL, excelRows);
    }
}
