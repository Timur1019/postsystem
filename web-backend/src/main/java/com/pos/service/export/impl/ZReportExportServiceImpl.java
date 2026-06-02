package com.pos.service.export.impl;

import com.pos.entity.Sale;
import com.pos.entity.SaleItem;
import com.pos.entity.ZReport;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.SaleRepository;
import com.pos.repository.ZReportRepository;
import com.pos.repository.spec.ZReportSpecifications;
import com.pos.service.export.ZReportExportService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.spreadsheet.ExcelSpreadsheetWriter;
import com.pos.spreadsheet.ExcelTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
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
public class ZReportExportServiceImpl implements ZReportExportService {

    private static final ZoneId TZ = ZoneId.of("Asia/Tashkent");
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(TZ);

    private final ZReportRepository zReportRepository;
    private final SaleRepository saleRepository;
    private final ExcelSpreadsheetWriter excelWriter;
    private final TenantAccessSupport tenantAccess;

    @Override
    public byte[] exportListExcel(
        String employeeSearch,
        String fiscalCardId,
        String terminalSerial,
        Integer storeId,
        LocalDate closedFrom,
        LocalDate closedTo
    ) {
        Instant from = closedFrom != null ? closedFrom.atStartOfDay(TZ).toInstant() : null;
        Instant to = closedTo != null ? closedTo.plusDays(1).atStartOfDay(TZ).toInstant() : null;
        var spec = ZReportSpecifications.filter(
            tenantAccess.requireEffectiveCompanyId(),
            employeeSearch, fiscalCardId, terminalSerial, storeId, from, to
        );
        List<ZReport> all = zReportRepository.findAll(spec);

        List<Map<String, Object>> rows = new ArrayList<>();
        for (ZReport z : all) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("fiscal_card_id", z.getFiscalCardId());
            row.put("opened_at", z.getOpenedAt() != null ? DT.format(z.getOpenedAt()) : "");
            row.put("closed_at", z.getClosedAt() != null ? DT.format(z.getClosedAt()) : "");
            row.put("z_number", z.getZNumber() != null ? z.getZNumber() : 0);
            row.put("total_amount", z.getTotalAmount());
            row.put("vat_amount", z.getVatAmount());
            row.put("store_name", z.getStore() != null ? z.getStore().getName() : "");
            row.put("terminal_serial", z.getTerminalSerial());
            row.put("employee_name", z.getEmployeeName());
            rows.add(row);
        }
        return excelWriter.write(ExcelTemplate.Z_REPORTS_LIST, rows);
    }

    @Override
    public byte[] exportSalesForZReportExcel(Long zReportId) {
        ZReport z = zReportRepository.findById(zReportId)
            .orElseThrow(() -> new ResourceNotFoundException("Z-report not found"));
        if (z.getStore() != null) {
            tenantAccess.assertCanAccessStore(z.getStore());
        }
        List<Sale> sales = saleRepository.findCompletedForZReport(zReportId, Sale.SaleStatus.COMPLETED);

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Sale sale : sales) {
            String created = sale.getCreatedAt() != null ? DT.format(sale.getCreatedAt()) : "";
            String cashier = sale.getCashier() != null ? sale.getCashier().getFullName() : "";
            String pay = sale.getPaymentMethod() != null ? sale.getPaymentMethod().name() : "";
            for (SaleItem line : sale.getItems()) {
                var p = line.getProduct();
                BigDecimal rate = p != null && p.getTaxRate() != null ? p.getTaxRate() : new BigDecimal("12");
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("created_at", created);
                row.put("receipt_number", sale.getReceiptNumber());
                row.put("cashier", cashier);
                row.put("payment_method", pay);
                row.put("sale_total", sale.getTotalAmount());
                row.put("product_name", line.getProductName());
                row.put("product_sku", p != null && p.getSku() != null ? p.getSku() : "");
                row.put("ikpu", p != null && p.getIkpu() != null ? p.getIkpu() : "");
                row.put("quantity", line.getQuantity());
                row.put("unit_price", line.getUnitPrice());
                row.put("line_discount", line.getDiscount() != null ? line.getDiscount() : BigDecimal.ZERO);
                row.put("tax_amount", line.getTaxAmount() != null ? line.getTaxAmount() : BigDecimal.ZERO);
                row.put("tax_rate_percent", rate);
                row.put("line_total", line.getLineTotal());
                rows.add(row);
            }
        }
        return excelWriter.write(ExcelTemplate.Z_REPORT_SALES_LINES, rows);
    }
}
