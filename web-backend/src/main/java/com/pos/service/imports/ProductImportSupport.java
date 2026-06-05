package com.pos.service.imports;

import com.pos.domain.ProductQuantityRules;
import com.pos.domain.SaleType;
import com.pos.dto.product.ProductImportPreviewRow;
import com.pos.entity.Product;
import com.pos.service.imports.source.ProductImportRowFields;
import com.pos.service.product.ProductQuantityRulesResolver;
import com.pos.util.ProductImportParseUtil;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Общие утилиты для обработчиков импорта: построение preview-row, дедупликация по строке,
 * нормализация ячейки «расположение на складе». Логика конкретных источников живёт в их
 * {@code ProductImportSourceHandler}.
 */
public final class ProductImportSupport {

    private ProductImportSupport() {
    }

    public static String resolveStorageLocation(Map<String, String> row, String defaultLocation) {
        String fromFile = ProductImportParseUtil.cell(row, "storage_location");
        if (StringUtils.hasText(fromFile)) {
            return fromFile.trim();
        }
        return StringUtils.hasText(defaultLocation) ? defaultLocation.trim() : null;
    }

    /** Ключ дедупликации строк внутри одного файла (не по номеру фактуры — фактура может содержать много строк). */
    public static String rowDedupeKey(ProductImportPreviewRow row) {
        return "row:" + row.rowNum();
    }

    public static ProductImportPreviewRow invalidRow(int rowNum, String message) {
        return new ProductImportPreviewRow(
            rowNum, "", "", null, null, null, "", null, null, BigDecimal.ZERO,
            BigDecimal.ZERO, null, BigDecimal.ZERO,
            ProductImportPreviewRow.STATUS_INVALID,
            null, null, message
        );
    }

    public static ProductImportPreviewRow buildPreviewRow(
        int rowNum,
        String sku,
        String name,
        ProductImportRowFields fields,
        Product duplicate,
        String duplicateMessage
    ) {
        String unit = fields.unitOfMeasure();
        ProductQuantityRules rules = ProductQuantityRulesResolver.resolve(
            fields.saleType(),
            null,
            null,
            null,
            unit
        );
        String importSaleType = fields.saleType() != null ? fields.saleType().name() : null;
        String resolvedSaleType = rules.saleType().name();

        if (duplicate != null) {
            return new ProductImportPreviewRow(
                rowNum,
                sku,
                name,
                fields.ikpu(),
                fields.storageLocation(),
                fields.uzInvoiceDocumentId(),
                unit,
                importSaleType,
                resolvedSaleType,
                fields.quantity(),
                fields.sellingPrice(),
                duplicate.getSellingPrice(),
                fields.taxRatePercent(),
                ProductImportPreviewRow.STATUS_DUPLICATE,
                duplicate.getSku(),
                duplicate.getName(),
                duplicateMessage
            );
        }
        return new ProductImportPreviewRow(
            rowNum,
            sku,
            name,
            fields.ikpu(),
            fields.storageLocation(),
            fields.uzInvoiceDocumentId(),
            unit,
            importSaleType,
            resolvedSaleType,
            fields.quantity(),
            fields.sellingPrice(),
            null,
            fields.taxRatePercent(),
            ProductImportPreviewRow.STATUS_NEW,
            null,
            null,
            null
        );
    }

    public static SaleType parseImportSaleType(String importSaleType) {
        if (!StringUtils.hasText(importSaleType)) {
            return null;
        }
        String raw = importSaleType.trim().toUpperCase(java.util.Locale.ROOT);
        if (raw.equals("WEIGHT") || raw.equals("ВЕС") || raw.equals("KG")) {
            return SaleType.WEIGHT;
        }
        if (raw.equals("PIECE") || raw.equals("ШТ") || raw.equals("DONA") || raw.equals("PCS")) {
            return SaleType.PIECE;
        }
        if (raw.equals("SERVICE") || raw.equals("УСЛУГА") || raw.equals("XIZMAT")) {
            return SaleType.SERVICE;
        }
        try {
            return SaleType.valueOf(raw);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
