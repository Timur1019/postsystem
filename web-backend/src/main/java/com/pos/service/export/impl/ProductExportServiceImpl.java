package com.pos.service.export.impl;

import com.pos.dto.product.ProductExportPreviewRow;
import com.pos.dto.product.ProductExportRequest;
import com.pos.entity.Product;
import com.pos.repository.ProductRepository;
import com.pos.repository.spec.ProductSpecifications;
import com.pos.service.export.ProductExportService;
import com.pos.spreadsheet.ExcelSpreadsheetWriter;
import com.pos.spreadsheet.ExcelTemplate;
import com.pos.util.ProductImportParseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductExportServiceImpl implements ProductExportService {

    private final ProductRepository productRepository;
    private final ExcelSpreadsheetWriter excelWriter;

    @Override
    public List<ProductExportPreviewRow> previewExport(String storeIdsParam, BigDecimal markupPercent) {
        List<Product> products = loadProducts(storeIdsParam);
        BigDecimal markup = markupPercent != null ? markupPercent : BigDecimal.ZERO;
        List<ProductExportPreviewRow> rows = new ArrayList<>();
        for (Product p : products) {
            BigDecimal base = p.getSellingPrice();
            BigDecimal exportPrice = applyMarkup(base, markup);
            String category = p.getCategory() != null ? p.getCategory().getName() : "";
            rows.add(new ProductExportPreviewRow(
                p.getId(),
                p.getSku(),
                p.getName(),
                category,
                base,
                exportPrice
            ));
        }
        return rows;
    }

    @Override
    public byte[] exportCatalogExcel(ProductExportRequest request) {
        ProductExportRequest req = request != null ? request : new ProductExportRequest(null, BigDecimal.ZERO, List.of());
        List<Product> products = loadProducts(req.storeIds());
        Map<UUID, BigDecimal> overrides = new HashMap<>();
        if (req.priceOverrides() != null) {
            for (ProductExportRequest.PriceOverride o : req.priceOverrides()) {
                if (o != null && o.productId() != null && o.sellingPrice() != null) {
                    overrides.put(o.productId(), o.sellingPrice());
                }
            }
        }
        BigDecimal markup = req.markupPercent() != null ? req.markupPercent() : BigDecimal.ZERO;

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Product p : products) {
            BigDecimal exportPrice = overrides.getOrDefault(p.getId(), applyMarkup(p.getSellingPrice(), markup));
            String category = p.getCategory() != null ? p.getCategory().getName() : "";
            BigDecimal rate = p.getTaxRate() != null ? p.getTaxRate() : new BigDecimal("12");
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("sku", p.getSku());
            row.put("name", p.getName());
            row.put("category", category);
            row.put("selling_price", exportPrice);
            row.put("cost_price", p.getCostPrice() != null ? p.getCostPrice() : BigDecimal.ZERO);
            row.put("tax_rate_percent_nds", rate);
            row.put("ikpu", p.getIkpu() != null ? p.getIkpu() : "");
            row.put("unit_of_measure", p.getUnitOfMeasure() != null ? p.getUnitOfMeasure() : "");
            row.put("barcode", p.getBarcode() != null ? p.getBarcode() : "");
            row.put("stock_quantity", p.getStockQuantity());
            row.put("active", p.isActive() ? 1 : 0);
            rows.add(row);
        }
        return excelWriter.write(ExcelTemplate.PRODUCTS_CATALOG, rows);
    }

    @Override
    public byte[] buildImportTemplateExcel() {
        return excelWriter.write(ExcelTemplate.PRODUCTS_CATALOG, List.of());
    }

    private List<Product> loadProducts(String storeIdsParam) {
        Specification<Product> spec = ProductSpecifications.catalogFilter(
            null, null, "ACTIVE", null, null, null, null, null
        );
        List<Integer> storeIds = ProductImportParseUtil.parseStoreIdList(storeIdsParam);
        if (!storeIds.isEmpty()) {
            spec = spec.and(ProductSpecifications.storePriceInOneOf(storeIds));
        }
        return productRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "name"));
    }

    private static BigDecimal applyMarkup(BigDecimal base, BigDecimal markupPercent) {
        if (base == null) {
            return BigDecimal.ZERO;
        }
        if (markupPercent == null || markupPercent.compareTo(BigDecimal.ZERO) == 0) {
            return base.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal factor = BigDecimal.ONE.add(
            markupPercent.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP)
        );
        return base.multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }
}
