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
import com.pos.service.imports.ProductImportParseOptions;
import com.pos.service.imports.ProductImportService;
import com.pos.service.imports.ProductImportSource;
import com.pos.service.imports.ProductImportSupport;
import com.pos.service.imports.source.ProductImportSourceHandler;
import com.pos.service.imports.source.ProductImportSourceHandlers;
import com.pos.service.support.TenantAccessSupport;
import com.pos.spreadsheet.parser.HtmlExcelTableParser;
import com.pos.spreadsheet.parser.UzInvoiceJsonParser;
import com.pos.domain.ProductQuantityRules;
import com.pos.service.product.ProductQuantityRulesResolver;
import com.pos.util.ProductImportParseUtil;
import com.pos.util.QuantityUtil;
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
    private final ProductImportSourceHandlers sourceHandlers;
    private final TenantAccessSupport tenantAccess;

    @Lazy
    @Autowired
    private ProductService productService;

    public ProductImportServiceImpl(
        ProductRepository productRepository,
        CategoryRepository categoryRepository,
        StoreRepository storeRepository,
        ProductImportSourceHandlers sourceHandlers,
        TenantAccessSupport tenantAccess
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.storeRepository = storeRepository;
        this.sourceHandlers = sourceHandlers;
        this.tenantAccess = tenantAccess;
    }

    @Override
    @Transactional(readOnly = true)
    public ProductImportPreviewResponse preview(
        MultipartFile file,
        String source,
        ProductImportParseOptions options
    ) {
        ProductImportSource importSource = ProductImportSource.fromParam(source);
        ProductImportSourceHandler handler = sourceHandlers.require(importSource);
        ProductImportParseOptions parseOpts =
            options != null ? options : ProductImportParseOptions.defaults();
        List<Map<String, String>> rows = parseRows(file, handler);
        List<ProductImportPreviewRow> preview = new ArrayList<>();
        int rowNum = 2;
        for (Map<String, String> row : rows) {
            if (ProductImportParseUtil.isRowEmpty(row)) {
                continue;
            }
            preview.add(handler.toPreviewRow(rowNum++, row, parseOpts));
        }
        int dup = (int) preview.stream().filter(r -> ProductImportPreviewRow.STATUS_DUPLICATE.equals(r.status())).count();
        int invalid = (int) preview.stream().filter(r -> ProductImportPreviewRow.STATUS_INVALID.equals(r.status())).count();
        int newRows = (int) preview.stream().filter(r -> ProductImportPreviewRow.STATUS_NEW.equals(r.status())).count();
        String fileInvoiceId = handler.resolveFileInvoiceId(rows);
        boolean invoiceAlreadyImported = handler.isFileAlreadyImported(fileInvoiceId);
        return new ProductImportPreviewResponse(
            importSource.name(),
            fileInvoiceId,
            invoiceAlreadyImported,
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
        ProductImportParseOptions parseOpts = ProductImportParseOptions.fromConfirm(opts);

        ProductImportPreviewResponse preview = preview(file, source, parseOpts);
        String raw = opts.strategy() != null ? opts.strategy().trim().toUpperCase(Locale.ROOT) : "AS_FILE";
        boolean pushToAllStores = "TO_STORES".equals(raw);

        Map<Integer, ProductImportConfirmRequest.ImportRowConfirm> overrides = buildOverrideMap(opts);
        Integer defaultCategoryId = resolveCategoryId(opts.defaultCategoryId(), "Общая категория для импорта");
        Integer defaultStoreId = resolveStoreId(opts.defaultStoreId(), "Общий магазин для импорта");
        if (pushToAllStores && defaultStoreId == null) {
            throw new BadRequestException("Выберите магазин для импорта в выбранный магазин(ы)");
        }

        List<String> errors = new ArrayList<>();
        int created = 0;
        int skipped = 0;
        Set<String> seenRowKeys = new HashSet<>();

        List<Store> activeStores = storeRepository.findByCompanyIdOrderByNameAsc(
            tenantAccess.requireEffectiveCompanyId()
        ).stream().filter(Store::isActive).toList();

        for (ProductImportPreviewRow row : preview.rows()) {
            if (ProductImportPreviewRow.STATUS_INVALID.equals(row.status())) {
                errors.add("Строка " + row.rowNum() + ": " + row.message());
                skipped++;
                continue;
            }
            if (ProductImportPreviewRow.STATUS_DUPLICATE.equals(row.status())) {
                skipped++;
                continue;
            }
            if (!ProductImportPreviewRow.STATUS_NEW.equals(row.status())) {
                skipped++;
                continue;
            }

            String rowKey = ProductImportSupport.rowDedupeKey(row);
            if (!seenRowKeys.add(rowKey)) {
                errors.add("Строка " + row.rowNum() + ": дубликат позиции в файле");
                skipped++;
                continue;
            }

            ProductImportConfirmRequest.ImportRowConfirm rowOpts = overrides.get(row.rowNum());
            try {
                createFromPreview(
                    row, rowOpts, defaultCategoryId, defaultStoreId, opts.defaultStorageLocation(),
                    pushToAllStores, activeStores
                );
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
        return new ProductImportConfirmRequest("AS_FILE", "CATALOG", true, null, null, null, List.of());
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
        var category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new BadRequestException(context + ": категория не найдена"));
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        if (category.getCompany() == null || !category.getCompany().getId().equals(companyId)) {
            throw new BadRequestException(context + ": категория не принадлежит вашей компании");
        }
        return categoryId;
    }

    private Integer resolveStoreId(Integer storeId, String context) {
        if (storeId == null) {
            return null;
        }
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new BadRequestException(context + ": магазин не найден"));
        tenantAccess.assertCanAccessStore(store);
        if (!store.isActive()) {
            throw new BadRequestException(context + ": магазин неактивен");
        }
        return storeId;
    }

    private void createFromPreview(
        ProductImportPreviewRow row,
        ProductImportConfirmRequest.ImportRowConfirm rowOpts,
        Integer defaultCategoryId,
        Integer defaultStoreId,
        String defaultStorageLocation,
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
        BigDecimal taxRate = ProductImportParseUtil.normalizeTaxRatePercent(row.taxRatePercent());
        String unit = StringUtils.hasText(row.unitOfMeasure()) ? row.unitOfMeasure().trim() : "dona";
        ProductQuantityRules quantityRules = ProductQuantityRulesResolver.resolve(
            ProductImportSupport.parseImportSaleType(row.importSaleType()),
            null,
            null,
            null,
            unit
        );
        BigDecimal initialStock = QuantityUtil.normalize(row.quantity());
        if (initialStock.signum() < 0) {
            initialStock = BigDecimal.ZERO;
        }

        Integer storeId = defaultStoreId;
        if (rowOpts != null && rowOpts.storeId() != null) {
            storeId = resolveStoreId(rowOpts.storeId(), "Строка " + row.rowNum());
        }

        List<ProductStorePriceRequest> storePrices = null;
        if (storeId != null) {
            storePrices = List.of(new ProductStorePriceRequest(storeId, sellingPrice));
        } else if (pushToAllStores && !activeStores.isEmpty()) {
            storePrices = activeStores.stream()
                .map(s -> new ProductStorePriceRequest(s.getId(), sellingPrice))
                .toList();
        }

        String storageLocation = row.storageLocation();
        if (rowOpts != null && StringUtils.hasText(rowOpts.storageLocation())) {
            storageLocation = rowOpts.storageLocation().trim();
        } else if (!StringUtils.hasText(storageLocation) && StringUtils.hasText(defaultStorageLocation)) {
            storageLocation = defaultStorageLocation.trim();
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
            com.pos.service.product.ProductTypeSupport.resolve(null, quantityRules.saleType()),
            quantityRules.saleType(),
            quantityRules.unitCode(),
            quantityRules.quantityScale(),
            quantityRules.allowFraction(),
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
            storageLocation,
            null,
            null,
            null,
            row.uzInvoiceDocumentId(),
            storePrices,
            null,
            null,
            null,
            null
        );
        productService.createProduct(req);
    }

    private List<Map<String, String>> parseRows(MultipartFile file, ProductImportSourceHandler handler) {
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
                return handler.parseJson(bytes);
            }
            try (InputStream in = new java.io.ByteArrayInputStream(bytes)) {
                return handler.parseSpreadsheet(in);
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException(
                "Не удалось прочитать файл: " + e.getMessage(),
                java.util.Map.of(
                    "source", handler.source().name(),
                    "cause", e.getClass().getSimpleName()
                ),
                e
            );
        }
    }
}
