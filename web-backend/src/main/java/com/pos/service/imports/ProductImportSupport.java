package com.pos.service.imports;

import com.pos.dto.product.ProductImportPreviewRow;
import com.pos.entity.Product;
import com.pos.repository.ProductRepository;
import com.pos.util.ProductImportParseUtil;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

public final class ProductImportSupport {

    private ProductImportSupport() {
    }

    public static ProductImportPreviewRow toPreviewRow(
        int rowNum,
        Map<String, String> row,
        ProductRepository productRepository
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

        String ikpu = StringUtils.hasText(ProductImportParseUtil.cell(row, "ikpu"))
            ? ProductImportParseUtil.cell(row, "ikpu").trim()
            : null;

        BigDecimal taxRate = ProductImportParseUtil.parseDecimalOpt(ProductImportParseUtil.cell(row, "tax_rate_percent_nds"))
            .orElse(new BigDecimal("12"));
        int qty = ProductImportParseUtil.parseIntOpt(ProductImportParseUtil.cell(row, "stock_quantity")).orElse(0);
        String unit = ProductImportParseUtil.cell(row, "unit_of_measure");

        Optional<Product> existing = findExisting(productRepository, sku, name, ikpu);
        if (existing.isPresent()) {
            Product p = existing.get();
            return new ProductImportPreviewRow(
                rowNum,
                sku,
                name,
                ikpu,
                unit,
                qty,
                sellingOpt.get(),
                p.getSellingPrice(),
                taxRate,
                ProductImportPreviewRow.STATUS_DUPLICATE,
                p.getSku(),
                p.getName(),
                "Товар уже есть в базе: " + p.getSku() + " — " + p.getName()
            );
        }

        return new ProductImportPreviewRow(
            rowNum,
            sku,
            name,
            ikpu,
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

    private static Optional<Product> findExisting(ProductRepository repo, String sku, String name, String ikpu) {
        if (repo.existsBySku(sku)) {
            return repo.findBySku(sku);
        }
        if (StringUtils.hasText(ikpu) && repo.existsByIkpu(ikpu)) {
            return repo.findByIkpu(ikpu);
        }
        if (repo.existsByNameIgnoreCase(name)) {
            return repo.findByNameIgnoreCase(name);
        }
        return Optional.empty();
    }

    private static ProductImportPreviewRow invalid(int rowNum, String message) {
        return new ProductImportPreviewRow(
            rowNum, "", "", null, "", 0,
            BigDecimal.ZERO, null, BigDecimal.ZERO,
            ProductImportPreviewRow.STATUS_INVALID,
            null, null, message
        );
    }
}
