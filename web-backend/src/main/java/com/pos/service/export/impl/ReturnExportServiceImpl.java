package com.pos.service.export.impl;

import com.pos.entity.Sale;
import com.pos.repository.SaleItemRepository;
import com.pos.repository.SaleRepository;
import com.pos.service.export.ReturnExportService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.spreadsheet.ExcelSpreadsheetWriter;
import com.pos.spreadsheet.ExcelTemplate;
import com.pos.util.ReturnNotesSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReturnExportServiceImpl implements ReturnExportService {

    private static final ZoneId TZ = ZoneId.of("Asia/Tashkent");
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm").withZone(TZ);

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ExcelSpreadsheetWriter excelWriter;
    private final TenantAccessSupport tenantAccess;

    @Override
    public byte[] exportReturnsExcel(
        LocalDate from,
        LocalDate to,
        String cashierName,
        String fiscalSearch,
        Integer storeId
    ) {
        ZoneId z = ZoneId.systemDefault();
        Instant start = from != null ? from.atStartOfDay(z).toInstant() : Instant.EPOCH;
        Instant end = to != null ? to.plusDays(1).atStartOfDay(z).toInstant()
            : Instant.now().plus(3650, ChronoUnit.DAYS);

        Page<Sale> page = saleRepository.searchReturns(
            List.of(Sale.SaleStatus.VOIDED, Sale.SaleStatus.REFUNDED),
            start,
            end,
            blankToNull(cashierName),
            blankToNull(fiscalSearch),
            storeId,
            tenantAccess.requireEffectiveCompanyId(),
            Pageable.unpaged()
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Sale sale : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("created_at", sale.getCreatedAt() != null ? DT.format(sale.getCreatedAt()) : "");
            row.put("fiscal_module_id", sale.getReceiptNumber() != null ? sale.getReceiptNumber() : "");
            row.put("total_amount", sale.getTotalAmount());
            row.put("positions_count", saleItemRepository.countBySale_Id(sale.getId()));
            row.put(
                "store_name",
                sale.getStore() != null && sale.getStore().getName() != null ? sale.getStore().getName() : ""
            );
            row.put(
                "cashier_name",
                sale.getCashier() != null && sale.getCashier().getFullName() != null
                    ? sale.getCashier().getFullName()
                    : ""
            );
            row.put("reason", ReturnNotesSupport.extractReason(sale.getNotes()));
            row.put("status", sale.getStatus() != null ? sale.getStatus().name() : "");
            rows.add(row);
        }

        return excelWriter.write(ExcelTemplate.RETURNS_JOURNAL, rows);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
