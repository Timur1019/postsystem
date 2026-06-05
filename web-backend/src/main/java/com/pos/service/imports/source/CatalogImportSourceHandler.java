package com.pos.service.imports.source;

import com.pos.dto.product.ProductImportPreviewRow;
import com.pos.entity.Product;
import com.pos.repository.ProductRepository;
import com.pos.service.imports.ProductImportParseOptions;
import com.pos.service.support.TenantAccessSupport;
import com.pos.service.imports.ProductImportSource;
import com.pos.service.imports.ProductImportSupport;
import com.pos.spreadsheet.ExcelSpreadsheetReader;
import com.pos.spreadsheet.ExcelTemplate;
import com.pos.spreadsheet.parser.CatalogJsonParser;
import com.pos.util.ProductImportParseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CatalogImportSourceHandler implements ProductImportSourceHandler {

    private final ExcelSpreadsheetReader excelSpreadsheetReader;
    private final CatalogJsonParser catalogJsonParser;
    private final ProductRepository productRepository;
    private final TenantAccessSupport tenantAccess;

    @Override
    public ProductImportSource source() {
        return ProductImportSource.CATALOG;
    }

    @Override
    public List<Map<String, String>> parseSpreadsheet(InputStream in) throws IOException {
        return excelSpreadsheetReader.read(in, ExcelTemplate.PRODUCTS_CATALOG);
    }

    @Override
    public List<Map<String, String>> parseJson(byte[] bytes) {
        return catalogJsonParser.parse(bytes);
    }

    @Override
    public String resolveFileInvoiceId(List<Map<String, String>> rows) {
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

        if (!StringUtils.hasText(name) && !StringUtils.hasText(sku)) {
            return ProductImportSupport.invalidRow(rowNum, "Пустая строка");
        }
        if (!StringUtils.hasText(sku)) {
            return ProductImportSupport.invalidRow(rowNum, "Не указан артикул (SKU)");
        }
        sku = sku.trim();
        if (!StringUtils.hasText(name)) {
            return ProductImportSupport.invalidRow(rowNum, "Не указано наименование");
        }
        name = name.trim();

        ProductImportRowFields fields = parsed.fields();
        Optional<Product> existing = findDuplicateBySku(sku);
        return ProductImportSupport.buildPreviewRow(
            rowNum, sku, name, fields, existing.orElse(null),
            existing.map(p -> "Товар уже есть в базе: " + p.getSku() + " — " + p.getName()).orElse(null)
        );
    }

    /** Только SKU в рамках компании; ИКПУ и название могут повторяться. */
    private Optional<Product> findDuplicateBySku(String sku) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        if (productRepository.existsByCompany_IdAndSkuAndIsActiveTrue(companyId, sku)) {
            return productRepository.findByCompany_IdAndSkuAndIsActiveTrue(companyId, sku);
        }
        return Optional.empty();
    }
}
