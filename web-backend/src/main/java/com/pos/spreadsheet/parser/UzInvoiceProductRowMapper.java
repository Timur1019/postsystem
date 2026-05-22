package com.pos.spreadsheet.parser;

import com.pos.util.ProductImportParseUtil;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Сборка строки номенклатуры POS из полей счёт-фактуры (Excel / JSON).
 */
public final class UzInvoiceProductRowMapper {

    private static final Pattern IKPU_CODE = Pattern.compile("(\\d{10,20})");
    private static final Pattern TOTAL_ROW = Pattern.compile("(?i).*(жами|jami|итого|total).*");

    private UzInvoiceProductRowMapper() {
    }

    public static Map<String, String> toCatalogRow(
        String name,
        String ikpuRaw,
        String unit,
        String qtyRaw,
        String priceRaw,
        String vatRaw,
        int rowNum,
        String uzInvoiceDocumentId
    ) {
        if (!StringUtils.hasText(name) || TOTAL_ROW.matcher(name.trim()).matches()) {
            return null;
        }

        String ikpu = extractIkpu(ikpuRaw);
        if (!StringUtils.hasText(unit)) {
            unit = "dona";
        }

        int qty = ProductImportParseUtil.parseIntOpt(qtyRaw).orElse(0);
        BigDecimal price = ProductImportParseUtil.parseDecimalOpt(priceRaw).orElse(null);
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        BigDecimal vat = ProductImportParseUtil.normalizeTaxRatePercent(
            ProductImportParseUtil.parseDecimalOpt(
                vatRaw != null ? vatRaw.replace("%", "").trim() : ""
            ).orElse(null)
        );

        String normDoc = null;
        if (StringUtils.hasText(uzInvoiceDocumentId)) {
            normDoc = uzInvoiceDocumentId.trim().toUpperCase(Locale.ROOT);
        }

        String sku = ProductImportParseUtil.resolveUzInvoiceSku(normDoc, rowNum);

        Map<String, String> map = new LinkedHashMap<>();
        map.put("sku", sku);
        map.put("name", name.trim());
        map.put("ikpu", ikpu != null ? ikpu : "");
        map.put("unit_of_measure", unit.trim());
        map.put("stock_quantity", String.valueOf(Math.max(0, qty)));
        map.put("selling_price", price.toPlainString());
        map.put("cost_price", "0");
        map.put("tax_rate_percent_nds", vat.toPlainString());
        map.put("active", "1");
        if (normDoc != null) {
            map.put(UzInvoiceDocumentIdExtractor.ROW_KEY_UZ_INVOICE_DOCUMENT_ID, normDoc);
        }
        return map;
    }

    public static String extractIkpu(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        var m = IKPU_CODE.matcher(raw);
        return m.find() ? m.group(1) : null;
    }
}
