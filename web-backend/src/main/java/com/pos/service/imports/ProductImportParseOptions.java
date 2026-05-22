package com.pos.service.imports;

import com.pos.dto.product.ProductImportConfirmRequest;
import org.springframework.util.StringUtils;

/**
 * Параметры разбора строк при предпросмотре и подтверждении импорта.
 */
public record ProductImportParseOptions(String defaultStorageLocation) {

    public static ProductImportParseOptions defaults() {
        return new ProductImportParseOptions(null);
    }

    public static ProductImportParseOptions fromConfirm(ProductImportConfirmRequest req) {
        if (req == null) {
            return defaults();
        }
        String loc = StringUtils.hasText(req.defaultStorageLocation())
            ? req.defaultStorageLocation().trim()
            : null;
        return new ProductImportParseOptions(loc);
    }

    public static ProductImportParseOptions forPreview(String defaultStorageLocation) {
        String loc = StringUtils.hasText(defaultStorageLocation) ? defaultStorageLocation.trim() : null;
        return new ProductImportParseOptions(loc);
    }
}
