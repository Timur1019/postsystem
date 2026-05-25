package com.pos.service.imports.source;

import com.pos.dto.product.ProductImportPreviewRow;
import com.pos.entity.Product;
import com.pos.repository.ProductRepository;
import com.pos.service.imports.ProductImportParseOptions;
import com.pos.service.imports.ProductImportSource;
import com.pos.service.imports.ProductImportSupport;
import com.pos.spreadsheet.parser.UzInvoiceDocumentIdExtractor;
import com.pos.spreadsheet.parser.UzInvoiceJsonParser;
import com.pos.spreadsheet.parser.UzInvoiceSpreadsheetParser;
import com.pos.util.ProductImportParseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UzInvoiceImportSourceHandler implements ProductImportSourceHandler {

    private final UzInvoiceSpreadsheetParser uzInvoiceSpreadsheetParser;
    private final UzInvoiceJsonParser uzInvoiceJsonParser;
    private final ProductRepository productRepository;

    @Override
    public ProductImportSource source() {
        return ProductImportSource.UZ_INVOICE;
    }

    @Override
    public List<Map<String, String>> parseSpreadsheet(InputStream in) throws IOException {
        return uzInvoiceSpreadsheetParser.parse(in);
    }

    @Override
    public List<Map<String, String>> parseJson(byte[] bytes) {
        return uzInvoiceJsonParser.parse(bytes);
    }

    @Override
    public boolean isFileAlreadyImported(String fileInvoiceId) {
        if (!StringUtils.hasText(fileInvoiceId)) {
            return false;
        }
        return productRepository.existsByUzInvoiceDocumentIdAndIsActiveTrue(fileInvoiceId)
            || productRepository.existsBySkuStartingWithAndIsActiveTrue(fileInvoiceId + "-L-");
    }

    @Override
    public String resolveFileInvoiceId(List<Map<String, String>> rows) {
        if (rows == null) {
            return null;
        }
        for (Map<String, String> row : rows) {
            String raw = ProductImportParseUtil.cell(row, UzInvoiceDocumentIdExtractor.ROW_KEY_UZ_INVOICE_DOCUMENT_ID);
            if (StringUtils.hasText(raw)) {
                return raw.trim().toUpperCase(Locale.ROOT);
            }
        }
        return null;
    }

    @Override
    public ProductImportPreviewRow toPreviewRow(int rowNum, Map<String, String> row, ProductImportParseOptions options) {
        ProductImportRowParser.Result parsed = ProductImportRowParser.parse(rowNum, row, source(), options);
        if (parsed.isInvalid()) {
            return parsed.invalid();
        }

        String sku = ProductImportParseUtil.cell(row, "sku");
        String name = ProductImportParseUtil.cell(row, "name");

        if (!StringUtils.hasText(name)) {
            if (!StringUtils.hasText(sku)) {
                return ProductImportSupport.invalidRow(rowNum, "Пустая строка");
            }
            return ProductImportSupport.invalidRow(rowNum, "Не указано наименование");
        }
        name = name.trim();
        ProductImportRowFields fields = parsed.fields();
        if (!StringUtils.hasText(sku)) {
            sku = ProductImportParseUtil.resolveUzInvoiceSku(fields.uzInvoiceDocumentId(), rowNum);
        } else {
            sku = sku.trim();
        }

        Optional<Product> existing = findDuplicate(fields.uzInvoiceDocumentId());
        String message = existing.isPresent() && fields.uzInvoiceDocumentId() != null
            ? "Счёт-фактура " + fields.uzInvoiceDocumentId() + " уже импортирована"
            : existing.map(p -> "Товар уже есть в базе: " + p.getSku() + " — " + p.getName()).orElse(null);

        return ProductImportSupport.buildPreviewRow(
            rowNum, sku, name, fields, existing.orElse(null), message
        );
    }

    /** Только по номеру e-фактуры: ИКПУ/SKU/имя не сравниваем. */
    private Optional<Product> findDuplicate(String uzInvoiceDocumentId) {
        if (uzInvoiceDocumentId == null) {
            return Optional.empty();
        }
        Optional<Product> byDoc = productRepository.findFirstByUzInvoiceDocumentIdAndIsActiveTrue(uzInvoiceDocumentId);
        if (byDoc.isPresent()) {
            return byDoc;
        }
        String skuPrefix = uzInvoiceDocumentId + "-L-";
        if (productRepository.existsBySkuStartingWithAndIsActiveTrue(skuPrefix)) {
            return productRepository.findFirstBySkuStartingWithAndIsActiveTrueOrderBySkuAsc(skuPrefix);
        }
        return Optional.empty();
    }
}
