package com.pos.service.export.impl;

import com.pos.entity.Product;
import com.pos.entity.Sale;
import com.pos.entity.SaleItem;
import com.pos.repository.SaleRepository;
import com.pos.service.export.SaleExportService;
import com.pos.service.support.SalesQuerySupport;
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

    private final SaleRepository saleRepository;
    private final ExcelSpreadsheetWriter excelWriter;

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
        Page<Sale> sales = saleRepository.searchSales(
            f.start(), f.end(), f.cashierId(), f.receipt(), f.cashierName(), f.q(),
            f.paymentMethod(), f.status(), f.saleId(), f.paymentSettlement(), f.storeId(),
            Pageable.unpaged()
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Sale sale : sales.getContent()) {
            String created = sale.getCreatedAt() != null ? DT.format(sale.getCreatedAt()) : "";
            String cashier = sale.getCashier() != null ? sale.getCashier().getFullName() : "";
            String store = sale.getStore() != null ? sale.getStore().getName() : "";
            String pay = sale.getPaymentMethod() != null ? sale.getPaymentMethod().name() : "";
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
                row.put("payment_method", pay);
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
}
