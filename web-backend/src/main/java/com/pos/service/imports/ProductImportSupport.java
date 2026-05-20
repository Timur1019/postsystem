package com.pos.service.imports;

import com.pos.dto.product.ProductImportPreviewRow;
import com.pos.entity.Product;
import com.pos.repository.ProductRepository;
import com.pos.spreadsheet.parser.UzInvoiceDocumentIdExtractor;
import com.pos.util.ProductImportParseUtil;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

public final class ProductImportSupport {

    private ProductImportSupport() {
    }

    public static ProductImportPreviewRow toPreviewRow(
        int rowNum,
        Map<String, String> row,
        ProductRepository productRepository,
        ProductImportSource source
    ) {
        String sku = ProductImportParseUtil.cell(row, "sku");
        String name = ProductImportParseUtil.cell(row, "name");
        if (!StringUtils.hasText(name) && !StringUtils.hasText(sku)) {
            return invalid(rowNum, "Пустая строка");
        }
        if (!StringUtils.hasText(sku)) {
            return invalid(rowNum, "Не указан артикул (SKU)");
        }
        sku = sku.trim();
        if (!StringUtils.hasText(name)) {
            return invalid(rowNum, "Не указано наименование");
        }
        name = name.trim();

        var sellingOpt = ProductImportParseUtil.parseDecimalOpt(ProductImportParseUtil.cell(row, "selling_price"));
        if (sellingOpt.isEmpty() || sellingOpt.get().compareTo(BigDecimal.valueOf(0.01)) < 0) {
            return invalid(rowNum, "Некорректная цена продажи");
        }

        String ikpuRaw = ProductImportParseUtil.cell(row, "ikpu");
        String ikpu = StringUtils.hasText(ikpuRaw) ? ikpuRaw.trim() : null;

        String uzDocRaw = ProductImportParseUtil.cell(row, UzInvoiceDocumentIdExtractor.ROW_KEY_UZ_INVOICE_DOCUMENT_ID);
        String uzInvoiceDocumentId =
            source == ProductImportSource.UZ_INVOICE && StringUtils.hasText(uzDocRaw)
                ? uzDocRaw.trim().toUpperCase(Locale.ROOT)
                : null;

        BigDecimal taxRate = ProductImportParseUtil.normalizeTaxRatePercent(
            ProductImportParseUtil.parseDecimalOpt(ProductImportParseUtil.cell(row, "tax_rate_percent_nds")).orElse(null)
        );
        int qty = ProductImportParseUtil.parseIntOpt(ProductImportParseUtil.cell(row, "stock_quantity")).orElse(0);
        String unit = ProductImportParseUtil.cell(row, "unit_of_measure");

        Optional<Product> existing = resolveDuplicateCandidate(
            productRepository, source, sku, name, ikpu, uzInvoiceDocumentId
        );
        if (existing.isPresent()) {
            Product p = existing.get();
            String dupMsg =
                source == ProductImportSource.UZ_INVOICE && uzInvoiceDocumentId != null
                    ? ("Позиция уже импортирована из этой счёт-фактуры " + uzInvoiceDocumentId + ": "
                    + p.getSku() + " — " + p.getName())
                    : ("Товар уже есть в базе: " + p.getSku() + " — " + p.getName());
            return new ProductImportPreviewRow(
                rowNum,
                sku,
                name,
                ikpu,
                uzInvoiceDocumentId,
                unit,
                qty,
                sellingOpt.get(),
                p.getSellingPrice(),
                taxRate,
                ProductImportPreviewRow.STATUS_DUPLICATE,
                p.getSku(),
                p.getName(),
                dupMsg
            );
        }

        return new ProductImportPreviewRow(
            rowNum,
            sku,
            name,
            ikpu,
            uzInvoiceDocumentId,
            unit,
            qty,
            sellingOpt.get(),
            null,
            taxRate,
            ProductImportPreviewRow.STATUS_NEW,
            null,
            null,
            null
        );
    }

    /**
     * Только счёт-фактура ({@link ProductImportSource#UZ_INVOICE}): совпадение строго по номеру e-фактуры + ИКПУ/SKU строки —
     * без сравнения «как строка таблицы» по глобальному ИКПУ или наименованию.
     * Если номер фактуры из файла не извлечён — дубликатов превью нет (старый товар в базе без этой пары не учитываем).
     */
    private static Optional<Product> resolveDuplicateCandidate(
        ProductRepository repo,
        ProductImportSource source,
        String sku,
        String name,
        String ikpu,
        String uzInvoiceDocumentId
    ) {
        if (source != ProductImportSource.UZ_INVOICE) {
            return findExistingLegacy(repo, sku, name, ikpu);
        }
        if (uzInvoiceDocumentId != null) {
            return findExistingForUzInvoice(repo, uzInvoiceDocumentId, sku, ikpu);
        }
        return Optional.empty();
    }

    /** Дубликат строки счёт-фактуры только в паре номер счёта + ИКПУ (или SKU, если ИКПУ нет). */
    private static Optional<Product> findExistingForUzInvoice(
        ProductRepository repo,
        String uzInvoiceDocumentId,
        String sku,
        String ikpu
    ) {
        if (StringUtils.hasText(ikpu)) {
            return repo.findByUzInvoiceDocumentIdAndIkpuAndIsActiveTrue(uzInvoiceDocumentId, ikpu);
        }
        return repo.findByUzInvoiceDocumentIdAndSkuAndIsActiveTrue(uzInvoiceDocumentId, sku);
    }

    /** Каталог и старые импорты без номера счёта: глобальный SKU / ИКПУ / имя. */
    private static Optional<Product> findExistingLegacy(ProductRepository repo, String sku, String name, String ikpu) {
        if (repo.existsBySkuAndIsActiveTrue(sku)) {
            return repo.findBySkuAndIsActiveTrue(sku);
        }
        if (StringUtils.hasText(ikpu) && repo.existsByIkpuAndIsActiveTrue(ikpu)) {
            return repo.findByIkpuAndIsActiveTrue(ikpu);
        }
        if (repo.existsByNameIgnoreCaseAndIsActiveTrue(name)) {
            return repo.findByNameIgnoreCaseAndIsActiveTrue(name);
        }
        return Optional.empty();
    }

    private static ProductImportPreviewRow invalid(int rowNum, String message) {
        return new ProductImportPreviewRow(
            rowNum, "", "", null, null, "", 0,
            BigDecimal.ZERO, null, BigDecimal.ZERO,
            ProductImportPreviewRow.STATUS_INVALID,
            null, null, message
        );
    }
}
