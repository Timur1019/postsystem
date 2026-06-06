package com.pos.service.export.impl;

import com.pos.entity.Product;
import com.pos.entity.Sale;
import com.pos.entity.SaleItem;
import com.pos.repository.sale.SaleSearchRepository;
import com.pos.service.export.SaleExportService;
import com.pos.service.support.SalesQuerySupport;
import com.pos.service.support.TenantAccessSupport;
import com.pos.spreadsheet.ExcelSpreadsheetWriter;
import com.pos.spreadsheet.ExcelTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SaleExportServiceImpl implements SaleExportService {

    private static final ZoneId TZ = ZoneId.of("Asia/Tashkent");
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(TZ);

    private final SaleSearchRepository saleSearchRepository;
    private final ExcelSpreadsheetWriter excelWriter;
    private final TenantAccessSupport tenantAccess;

    @Override
    public byte[] exportSoldLinesExcel(
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
    ) {
        Optional<SalesQuerySupport.SalesFilter> filters = SalesQuerySupport.buildFilters(
            from, to, cashierId, search, receiptNumber, saleIdStr, cashierName,
            paymentMethodStr, statusStr, paymentSettlement, storeIdStr
        );
        if (filters.isEmpty()) {
            return excelWriter.write(ExcelTemplate.SALES_LEDGER_LINES, List.of());
        }

        var f = filters.get();
        Page<Sale> sales = saleSearchRepository.searchSales(
            f.start(), f.end(), f.cashierId(), f.receipt(), f.cashierName(), f.q(),
            f.paymentMethod(), f.status(), f.saleId(), f.paymentSettlement(), f.storeId(),
            tenantAccess.requireEffectiveCompanyId(),
            Pageable.unpaged()
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Sale sale : sales.getContent()) {
            String created = sale.getCreatedAt() != null ? DT.format(sale.getCreatedAt()) : "";
            String cashier = sale.getCashier() != null ? sale.getCashier().getFullName() : "";
            String store = sale.getStore() != null ? sale.getStore().getName() : "";
            String pay = formatPaymentForExport(sale);
            String cardType = sale.getCardType() != null ? sale.getCardType().name() : "";
            var shift = sale.getCashierShift();
            String shiftId = shift != null && shift.getId() != null ? shift.getId().toString() : "";
            String shiftOpened = shift != null && shift.getOpenedAt() != null ? DT.format(shift.getOpenedAt()) : "";
            String shiftClosed = shift != null && shift.getClosedAt() != null ? DT.format(shift.getClosedAt()) : "";
            String shiftStatus = shift != null && shift.getStatus() != null ? shift.getStatus().name() : "";
            String shiftZReportId = shift != null && shift.getZReport() != null && shift.getZReport().getId() != null
                ? shift.getZReport().getId().toString()
                : "";
            for (SaleItem line : sale.getItems()) {
                Product p = line.getProduct();
                BigDecimal rate = p != null && p.getTaxRate() != null ? p.getTaxRate() : new BigDecimal("12");
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("receipt_number", sale.getReceiptNumber());
                row.put("sale_id", sale.getId().toString());
                row.put("created_at", created);
                row.put("status", sale.getStatus().name());
                row.put("cashier", cashier);
                row.put("store", store);
                row.put("shift_id", shiftId);
                row.put("shift_opened_at", shiftOpened);
                row.put("shift_closed_at", shiftClosed);
                row.put("shift_status", shiftStatus);
                row.put("shift_z_report_id", shiftZReportId);
                row.put("payment_method", pay);
                row.put("card_type", cardType);
                row.put("product_sku", p != null && p.getSku() != null ? p.getSku() : "");
                row.put("product_name", line.getProductName());
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
        return excelWriter.write(ExcelTemplate.SALES_LEDGER_LINES, rows);
    }

    private static String formatPaymentForExport(Sale sale) {
        if (sale.getPaymentMethod() == null) {
            return "";
        }
        String pay = sale.getPaymentMethod().name();
        if (sale.getCardType() != null) {
            return pay + " (" + sale.getCardType().name() + ")";
        }
        return pay;
    }
}
