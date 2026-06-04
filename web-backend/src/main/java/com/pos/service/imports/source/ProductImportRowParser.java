package com.pos.service.imports.source;

import com.pos.dto.product.ProductImportPreviewRow;
import com.pos.service.imports.ProductImportParseOptions;
import com.pos.service.imports.ProductImportSource;
import com.pos.service.imports.ProductImportSupport;
import com.pos.spreadsheet.parser.UzInvoiceDocumentIdExtractor;
import com.pos.util.ProductImportParseUtil;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.Map;

/**
 * Общая для всех источников выборка полей строки + быстрая базовая валидация цены.
 * Возвращает либо разобранные поля, либо готовую invalid-строку preview.
 */
public final class ProductImportRowParser {

    private ProductImportRowParser() {
    }

    public static Result parse(int rowNum, Map<String, String> row, ProductImportSource source, ProductImportParseOptions options) {
        ProductImportParseOptions opts = options != null ? options : ProductImportParseOptions.defaults();

        String ikpuRaw = ProductImportParseUtil.cell(row, "ikpu");
        String ikpu = StringUtils.hasText(ikpuRaw) ? ikpuRaw.trim() : null;
        String storageLocation = ProductImportSupport.resolveStorageLocation(row, opts.defaultStorageLocation());

        String uzDocRaw = ProductImportParseUtil.cell(row, UzInvoiceDocumentIdExtractor.ROW_KEY_UZ_INVOICE_DOCUMENT_ID);
        String uzInvoiceDocumentId =
            source == ProductImportSource.UZ_INVOICE && StringUtils.hasText(uzDocRaw)
                ? uzDocRaw.trim().toUpperCase(Locale.ROOT)
                : null;

        var sellingOpt = ProductImportParseUtil.parseDecimalOpt(ProductImportParseUtil.cell(row, "selling_price"));
        if (sellingOpt.isEmpty() || sellingOpt.get().compareTo(new BigDecimal("0.01")) < 0) {
            return Result.invalid(ProductImportSupport.invalidRow(rowNum, "Некорректная цена продажи"));
        }

        BigDecimal taxRate = ProductImportParseUtil.normalizeTaxRatePercent(
            ProductImportParseUtil.parseDecimalOpt(ProductImportParseUtil.cell(row, "tax_rate_percent_nds")).orElse(null)
        );
        BigDecimal qty = ProductImportParseUtil.parseDecimalOpt(ProductImportParseUtil.cell(row, "stock_quantity"))
            .orElse(BigDecimal.ZERO);
        String unit = ProductImportParseUtil.cell(row, "unit_of_measure");

        return Result.ok(new ProductImportRowFields(
            ikpu,
            storageLocation,
            uzInvoiceDocumentId,
            sellingOpt.get(),
            taxRate,
            qty,
            unit
        ));
    }

    public record Result(ProductImportRowFields fields, ProductImportPreviewRow invalid) {
        public static Result ok(ProductImportRowFields fields) {
            return new Result(fields, null);
        }
        public static Result invalid(ProductImportPreviewRow row) {
            return new Result(null, row);
        }
        public boolean isInvalid() {
            return invalid != null;
        }
    }
}
