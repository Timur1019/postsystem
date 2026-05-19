package com.pos.service.imports.impl;

import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.ProductImportConfirmRequest;
import com.pos.dto.product.ProductImportPreviewResponse;
import com.pos.dto.product.ProductImportPreviewRow;
import com.pos.dto.product.ProductImportResponse;
import com.pos.dto.product.ProductStorePriceRequest;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.CategoryRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.StoreRepository;
import com.pos.service.ProductService;
import com.pos.service.imports.ProductImportService;
import com.pos.service.imports.ProductImportSource;
import com.pos.service.imports.ProductImportSupport;
import com.pos.spreadsheet.ExcelSpreadsheetReader;
import com.pos.spreadsheet.ExcelTemplate;
import com.pos.spreadsheet.parser.CatalogJsonParser;
import com.pos.spreadsheet.parser.HtmlExcelTableParser;
import com.pos.spreadsheet.parser.UzInvoiceJsonParser;
import com.pos.spreadsheet.parser.UzInvoiceSpreadsheetParser;
import com.pos.util.ProductImportParseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class ProductImportServiceImpl implements ProductImportService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;
    private final ExcelSpreadsheetReader excelSpreadsheetReader;
    private final UzInvoiceSpreadsheetParser uzInvoiceSpreadsheetParser;
    private final UzInvoiceJsonParser uzInvoiceJsonParser;
    private final CatalogJsonParser catalogJsonParser;

    @Lazy
    @Autowired
    private ProductService productService;

    public ProductImportServiceImpl(
        ProductRepository productRepository,
        CategoryRepository categoryRepository,
        StoreRepository storeRepository,
        ExcelSpreadsheetReader excelSpreadsheetReader,
        UzInvoiceSpreadsheetParser uzInvoiceSpreadsheetParser,
        UzInvoiceJsonParser uzInvoiceJsonParser,
        CatalogJsonParser catalogJsonParser
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.storeRepository = storeRepository;
        this.excelSpreadsheetReader = excelSpreadsheetReader;
        this.uzInvoiceSpreadsheetParser = uzInvoiceSpreadsheetParser;
        this.uzInvoiceJsonParser = uzInvoiceJsonParser;
        this.catalogJsonParser = catalogJsonParser;
    }

    @Override
    @Transactional(readOnly = true)
    public ProductImportPreviewResponse preview(MultipartFile file, String source) {
        ProductImportSource importSource = ProductImportSource.fromParam(source);
        List<Map<String, String>> rows = parseRows(file, importSource);
        List<ProductImportPreviewRow> preview = new ArrayList<>();
        int rowNum = 2;
        for (Map<String, String> row : rows) {
            if (ProductImportParseUtil.isRowEmpty(row)) {
                continue;
            }
            preview.add(ProductImportSupport.toPreviewRow(rowNum++, row, productRepository));
        }
        int dup = (int) preview.stream().filter(r -> ProductImportPreviewRow.STATUS_DUPLICATE.equals(r.status())).count();
        int invalid = (int) preview.stream().filter(r -> ProductImportPreviewRow.STATUS_INVALID.equals(r.status())).count();
        int newRows = (int) preview.stream().filter(r -> ProductImportPreviewRow.STATUS_NEW.equals(r.status())).count();
        return new ProductImportPreviewResponse(
            importSource.name(),
            preview.size(),
            newRows,
            dup,
            invalid,
            preview
        );
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public ProductImportResponse importFile(MultipartFile file, ProductImportConfirmRequest options) {
        ProductImportConfirmRequest opts = options != null ? options : defaultOptions();
        String source = opts.source() != null ? opts.source() : "CATALOG";
        boolean skipDuplicates = opts.skipDuplicates() == null || opts.skipDuplicates();

        ProductImportPreviewResponse preview = preview(file, source);
        String raw = opts.strategy() != null ? opts.strategy().trim().toUpperCase(Locale.ROOT) : "AS_FILE";
        boolean pushToAllStores = "TO_STORES".equals(raw);

        Map<Integer, ProductImportConfirmRequest.ImportRowConfirm> overrides = buildOverrideMap(opts);
        Integer defaultCategoryId = resolveCategoryId(opts.defaultCategoryId(), "Общая категория для импорта");

        List<String> errors = new ArrayList<>();
        int created = 0;
        int skipped = 0;
        Set<String> seenSkus = new HashSet<>();

        List<Store> activeStores = storeRepository.findAll().stream().filter(Store::isActive).toList();

        for (ProductImportPreviewRow row : preview.rows()) {
            if (ProductImportPreviewRow.STATUS_INVALID.equals(row.status())) {
                errors.add("Строка " + row.rowNum() + ": " + row.message());
                skipped++;
                continue;
            }
            if (ProductImportPreviewRow.STATUS_DUPLICATE.equals(row.status())) {
                if (skipDuplicates) {
                    errors.add("Строка " + row.rowNum() + ": " + row.message());
                }
                skipped++;
                continue;
            }
            if (!ProductImportPreviewRow.STATUS_NEW.equals(row.status())) {
                skipped++;
                continue;
            }

            String sku = row.sku().trim();
            if (!seenSkus.add(sku.toLowerCase(Locale.ROOT))) {
                errors.add("Строка " + row.rowNum() + ": дубликат SKU в файле");
                skipped++;
                continue;
            }

            ProductImportConfirmRequest.ImportRowConfirm rowOpts = overrides.get(row.rowNum());
            try {
                createFromPreview(row, rowOpts, defaultCategoryId, pushToAllStores, activeStores);
                created++;
            } catch (BadRequestException | ResourceNotFoundException ex) {
                errors.add("Строка " + row.rowNum() + ": " + ex.getMessage());
                skipped++;
            } catch (DataIntegrityViolationException ex) {
                errors.add("Строка " + row.rowNum() + ": " + ex.getMostSpecificCause().getMessage());
                skipped++;
            }
        }

        return new ProductImportResponse(created, skipped, errors);
    }

    private static ProductImportConfirmRequest defaultOptions() {
        return new ProductImportConfirmRequest("AS_FILE", "CATALOG", true, null, List.of());
    }

    private static Map<Integer, ProductImportConfirmRequest.ImportRowConfirm> buildOverrideMap(
        ProductImportConfirmRequest opts
    ) {
        Map<Integer, ProductImportConfirmRequest.ImportRowConfirm> map = new HashMap<>();
        if (opts.rows() == null) {
            return map;
        }
        for (ProductImportConfirmRequest.ImportRowConfirm row : opts.rows()) {
            map.put(row.rowNum(), row);
        }
        return map;
    }

    private Integer resolveCategoryId(Integer categoryId, String context) {
        if (categoryId == null) {
            return null;
        }
        if (!categoryRepository.existsById(categoryId)) {
            throw new BadRequestException(context + ": категория не найдена");
        }
        return categoryId;
    }

    private void createFromPreview(
        ProductImportPreviewRow row,
        ProductImportConfirmRequest.ImportRowConfirm rowOpts,
        Integer defaultCategoryId,
        boolean pushToAllStores,
        List<Store> activeStores
    ) {
        BigDecimal resolvedPrice = row.fileSellingPrice();
        if (rowOpts != null && rowOpts.sellingPrice() != null) {
            resolvedPrice = rowOpts.sellingPrice();
        }
        if (resolvedPrice == null || resolvedPrice.compareTo(new BigDecimal("0.01")) < 0) {
            throw new BadRequestException("Некорректная цена продажи");
        }
        final BigDecimal sellingPrice = resolvedPrice;

        Integer categoryId = defaultCategoryId;
        if (rowOpts != null && rowOpts.categoryId() != null) {
            categoryId = resolveCategoryId(rowOpts.categoryId(), "Строка " + row.rowNum());
        }

        BigDecimal costPrice = BigDecimal.ZERO;
        BigDecimal taxRate = row.taxRatePercent() != null ? row.taxRatePercent() : new BigDecimal("12");
        int initialStock = Math.max(0, row.quantity());

        String unit = StringUtils.hasText(row.unitOfMeasure()) ? row.unitOfMeasure().trim() : "dona";

        List<ProductStorePriceRequest> storePrices = null;
        if (pushToAllStores && !activeStores.isEmpty()) {
            storePrices = activeStores.stream()
                .map(s -> new ProductStorePriceRequest(s.getId(), sellingPrice))
                .toList();
        }

        CreateProductRequest req = new CreateProductRequest(
            row.sku(),
            row.name(),
            null,
            categoryId,
            costPrice,
            sellingPrice,
            BigDecimal.ZERO,
            taxRate,
            initialStock,
            10,
            null,
            null,
            null,
            row.ikpu(),
            null,
            unit,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            storePrices,
            null
        );
        productService.createProduct(req);
    }

    private List<Map<String, String>> parseRows(MultipartFile file, ProductImportSource source) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Файл не выбран");
        }
        String lower = java.util.Objects.requireNonNullElse(file.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
        try {
            byte[] bytes = file.getBytes();
            boolean htmlInvoice = HtmlExcelTableParser.isHtmlSpreadsheet(bytes);
            boolean json = UzInvoiceJsonParser.looksLikeJson(bytes)
                && !htmlInvoice
                && (lower.endsWith(".json") || !lower.endsWith(".xls") && !lower.endsWith(".xlsx"));
            boolean excel = lower.endsWith(".xlsx") || lower.endsWith(".xls") || htmlInvoice;
            if (!json && !excel) {
                throw new BadRequestException(
                    "Поддерживаются файлы Excel (.xls, .xlsx), HTML-счёт-фактура (.xls) или JSON (.json)"
                );
            }
            if (json) {
                if (source == ProductImportSource.UZ_INVOICE) {
                    return uzInvoiceJsonParser.parse(bytes);
                }
                return catalogJsonParser.parse(bytes);
            }
            try (InputStream in = new java.io.ByteArrayInputStream(bytes)) {
                if (source == ProductImportSource.UZ_INVOICE) {
                    return uzInvoiceSpreadsheetParser.parse(in);
                }
                return excelSpreadsheetReader.read(in, ExcelTemplate.PRODUCTS_CATALOG);
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Не удалось прочитать файл: " + e.getMessage());
        }
    }
}
