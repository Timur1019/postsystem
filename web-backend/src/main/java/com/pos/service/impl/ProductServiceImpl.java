package com.pos.service.impl;

import com.pos.dto.product.BulkTaxRateRequest;
import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.ProductExportPreviewRow;
import com.pos.dto.product.ProductExportRequest;
import com.pos.dto.product.ProductImportConfirmRequest;
import com.pos.dto.product.ProductImportPreviewResponse;
import com.pos.dto.product.ProductImportResponse;
import com.pos.dto.product.ProductResponse;
import com.pos.dto.product.ProductStorePriceRequest;
import com.pos.dto.product.ProductStorePriceRow;
import com.pos.dto.product.UpdateProductRequest;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.warehouse.WarehouseReceiveRequest;
import com.pos.entity.Category;
import com.pos.entity.Product;
import com.pos.entity.StockMovement;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.CategoryRepository;
import com.pos.repository.ProductBarcodeRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.ProductStorePriceRepository;
import com.pos.mapper.ProductMapper;
import com.pos.mapper.ProductStorePriceMapper;
import com.pos.repository.StockMovementRepository;
import com.pos.repository.projection.ProductDispatchedSum;
import com.pos.repository.StoreRepository;
import com.pos.repository.spec.ProductSpecifications;
import com.pos.service.ProductService;
import com.pos.service.export.ProductExportService;
import com.pos.service.imports.ProductImportService;
import com.pos.service.support.CashierSaleSupport;
import com.pos.service.support.AbstractProductCatalogSupport;
import com.pos.util.LogUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProductServiceImpl extends AbstractProductCatalogSupport implements ProductService {

    private final StockMovementRepository stockMovementRepository;
    private final ProductMapper productMapper;
    private final ProductStorePriceMapper productStorePriceMapper;
    private final ProductExportService productExportService;
    private final ProductImportService productImportService;

    @Lazy
    @Autowired
    private ProductService self;

    public ProductServiceImpl(
        ProductRepository productRepository,
        CategoryRepository categoryRepository,
        ProductBarcodeRepository productBarcodeRepository,
        ProductStorePriceRepository productStorePriceRepository,
        StoreRepository storeRepository,
        StockMovementRepository stockMovementRepository,
        ProductMapper productMapper,
        ProductStorePriceMapper productStorePriceMapper,
        ProductExportService productExportService,
        ProductImportService productImportService
    ) {
        super(productRepository, categoryRepository, productBarcodeRepository, productStorePriceRepository, storeRepository);
        this.stockMovementRepository = stockMovementRepository;
        this.productMapper = productMapper;
        this.productStorePriceMapper = productStorePriceMapper;
        this.productExportService = productExportService;
        this.productImportService = productImportService;
    }

    @Override
    public PageResponse<ProductResponse> getProducts(
        String search,
        Integer categoryId,
        boolean activeOnly,
        String deletedScope,
        Integer storeId,
        String ikpuStatus,
        Boolean markedProduct,
        Boolean soldIndividually,
        String barcodeExact,
        Pageable pageable
    ) {
        String scope = deletedScope != null ? deletedScope : (activeOnly ? "ACTIVE" : "ALL");
        Specification<Product> spec = ProductSpecifications.catalogFilter(
            search, categoryId, scope, storeId, ikpuStatus, markedProduct, soldIndividually, barcodeExact
        );
        Page<Product> page = productRepository.findAll(spec, pageable);
        List<Product> content = page.getContent();
        Map<UUID, Integer> storeCounts = loadStoreCounts(content);
        Map<UUID, Integer> dispatched = loadDispatchedCounts(content);
        return PageResponse.from(page.map(p -> mapProduct(p, storeCounts, dispatched)));
    }

    @Override
    public PageResponse<ProductResponse> getWarehouseProducts(
        String search,
        String barcodeContains,
        Boolean markedProduct,
        Pageable pageable
    ) {
        boolean hasFilter = StringUtils.hasText(search)
            || StringUtils.hasText(barcodeContains)
            || markedProduct != null;
        Page<Product> page = hasFilter
            ? productRepository.findAll(
                ProductSpecifications.warehouseFilter(search, barcodeContains, markedProduct),
                pageable
            )
            : productRepository.findByIsActiveTrue(pageable);
        List<Product> content = page.getContent();
        Map<UUID, Integer> storeCounts = loadStoreCounts(content);
        Map<UUID, Integer> dispatched = loadDispatchedCounts(content);
        return PageResponse.from(page.map(p -> mapProduct(p, storeCounts, dispatched)));
    }

    @Override
    public ProductResponse getProduct(UUID id) {
        return mapProduct(findDetailed(id), null);
    }

    @Override
    public ProductResponse getByBarcode(String barcode) {
        return mapProduct(validateBarcodeProduct(resolveByBarcode(barcode), null), null);
    }

    @Override
    public ProductResponse getByBarcode(String barcode, Integer storeId) {
        Product product = validateBarcodeProduct(resolveByBarcode(barcode), storeId);
        ProductResponse base = mapProduct(product, null);
        if (storeId == null) {
            return base;
        }
        BigDecimal price = productStorePriceRepository.findByProduct_IdAndStore_Id(product.getId(), storeId)
            .map(sp -> sp.getPrice())
            .orElse(product.getSellingPrice());
        return withSellingPrice(base, price);
    }

    private Product validateBarcodeProduct(Product product, Integer storeId) {
        if (!product.isActive()) {
            throw new BadRequestException("Product is not active");
        }
        if (storeId != null
            && productStorePriceRepository.findByProduct_IdAndStore_Id(product.getId(), storeId).isEmpty()) {
            throw new BadRequestException("Product is not available in this store");
        }
        return product;
    }

    private Product resolveByBarcode(String barcode) {
        Optional<Product> primary = productRepository.findByBarcode(barcode);
        if (primary.isPresent()) {
            return primary.get();
        }
        return productBarcodeRepository.findByBarcode(barcode)
            .map(pb -> pb.getProduct())
            .orElseThrow(() -> new ResourceNotFoundException("Product not found for barcode: " + barcode));
    }

    private ProductResponse mapProduct(Product product, Map<UUID, Integer> storeCounts) {
        return mapProduct(product, storeCounts, null);
    }

    private ProductResponse mapProduct(
        Product product,
        Map<UUID, Integer> storeCounts,
        Map<UUID, Integer> dispatchedByProduct
    ) {
        int storesCount = storeCounts != null
            ? storeCounts.getOrDefault(product.getId(), 0)
            : (int) productStorePriceRepository.countByProduct_Id(product.getId());
        int stockDispatched = dispatchedByProduct != null
            ? dispatchedByProduct.getOrDefault(product.getId(), 0)
            : (int) stockMovementRepository.sumDispatchedByProductId(product.getId());
        List<ProductStorePriceRow> storePrices = product.getStorePrices() == null
            ? List.of()
            : productStorePriceMapper.toRowList(product.getStorePrices());
        return withStockDispatched(
            productMapper.toResponse(
                product,
                storesCount,
                productMapper.mergeBarcodes(product),
                storePrices
            ),
            stockDispatched
        );
    }

    private Map<UUID, Integer> loadDispatchedCounts(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = products.stream().map(Product::getId).distinct().toList();
        return stockMovementRepository.sumDispatchedByProductIds(ids).stream()
            .collect(Collectors.toMap(
                ProductDispatchedSum::getProductId,
                row -> row.getDispatched() != null ? row.getDispatched().intValue() : 0
            ));
    }

    private static ProductResponse withStockDispatched(ProductResponse r, int stockDispatched) {
        return new ProductResponse(
            r.id(), r.sku(), r.name(), r.description(), r.categoryId(), r.categoryName(),
            r.costPrice(), r.sellingPrice(), r.taxRate(), r.stockQuantity(), stockDispatched,
            r.lowStockAlert(), r.lowStock(),
            r.barcode(), r.barcodes(), r.imageUrl(), r.active(), r.createdAt(), r.externalProductId(),
            r.ikpu(), r.ikpuStatus(), r.unitOfMeasure(), r.unitMeasureCode(), r.packageCode(),
            r.soldIndividually(), r.markedProduct(), r.storageLocation(), r.ownerType(),
            r.commissionTin(), r.commissionPinfl(), r.storesCount(), r.storePrices()
        );
    }

    private static ProductResponse withSellingPrice(ProductResponse r, BigDecimal sellingPrice) {
        return new ProductResponse(
            r.id(), r.sku(), r.name(), r.description(), r.categoryId(), r.categoryName(),
            r.costPrice(), sellingPrice, r.taxRate(), r.stockQuantity(), r.stockDispatched(),
            r.lowStockAlert(), r.lowStock(),
            r.barcode(), r.barcodes(), r.imageUrl(), r.active(), r.createdAt(), r.externalProductId(),
            r.ikpu(), r.ikpuStatus(), r.unitOfMeasure(), r.unitMeasureCode(), r.packageCode(),
            r.soldIndividually(), r.markedProduct(), r.storageLocation(), r.ownerType(),
            r.commissionTin(), r.commissionPinfl(), r.storesCount(), r.storePrices()
        );
    }

    @Override
    @Transactional
    public ProductResponse createProduct(CreateProductRequest req) {
        if (productRepository.existsBySku(req.sku())) {
            throw new BadRequestException("SKU already exists: " + req.sku());
        }

        Category category = req.categoryId() != null
            ? categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"))
            : null;

        assertBarcodeUniqueness(req.barcode(), null);
        assertNoDuplicateBarcodesInRequest(req.additionalBarcodes(), req.barcode());
        assertAdditionalBarcodesUnique(req.additionalBarcodes(), req.barcode(), null);

        Product product = Product.builder()
            .sku(req.sku())
            .name(req.name())
            .description(req.description())
            .category(category)
            .costPrice(req.costPrice())
            .sellingPrice(req.sellingPrice())
            .taxRate(req.taxRate())
            .stockQuantity(req.initialStock() != null ? req.initialStock() : 0)
            .lowStockAlert(req.lowStockAlert() != null ? req.lowStockAlert() : 10)
            .barcode(req.barcode())
            .imageUrl(req.imageUrl())
            .isActive(true)
            .externalProductId(req.externalProductId())
            .ikpu(req.ikpu())
            .ikpuStatus(StringUtils.hasText(req.ikpuStatus()) ? req.ikpuStatus() : "UNKNOWN")
            .unitOfMeasure(StringUtils.hasText(req.unitOfMeasure()) ? req.unitOfMeasure() : "pcs")
            .unitMeasureCode(req.unitMeasureCode())
            .packageCode(req.packageCode())
            .soldIndividually(req.soldIndividually() == null || req.soldIndividually())
            .markedProduct(Boolean.TRUE.equals(req.markedProduct()))
            .ownerType(StringUtils.hasText(req.ownerType()) ? req.ownerType() : "OWN")
            .commissionTin(req.commissionTin())
            .commissionPinfl(req.commissionPinfl())
            .build();

        Product saved = productRepository.save(product);
        applyStorePrices(saved, req.storePrices());
        applyExtraBarcodes(saved, req.additionalBarcodes(), saved.getBarcode());
        saved = productRepository.save(saved);
        int initialStock = req.initialStock() != null ? req.initialStock() : 0;
        if (initialStock > 0) {
            recordStockMovement(saved, initialStock, "RESTOCK", "Начальный остаток при создании товара");
        }
        return mapProduct(saved, null);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(UUID id, UpdateProductRequest req) {
        Product product = findDetailed(id);

        if (StringUtils.hasText(req.name())) {
            product.setName(req.name());
        }
        if (req.description() != null) {
            product.setDescription(req.description());
        }
        if (req.sellingPrice() != null) {
            product.setSellingPrice(req.sellingPrice());
        }
        if (req.costPrice() != null) {
            product.setCostPrice(req.costPrice());
        }
        if (req.taxRate() != null) {
            product.setTaxRate(req.taxRate());
        }
        if (req.lowStockAlert() != null) {
            product.setLowStockAlert(req.lowStockAlert());
        }
        if (StringUtils.hasText(req.imageUrl())) {
            product.setImageUrl(req.imageUrl());
        }
        if (req.categoryId() != null) {
            Category cat = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(cat);
        }
        if (req.externalProductId() != null) {
            product.setExternalProductId(req.externalProductId());
        }
        if (req.ikpu() != null) {
            product.setIkpu(req.ikpu());
        }
        if (req.ikpuStatus() != null) {
            product.setIkpuStatus(req.ikpuStatus());
        }
        if (req.unitOfMeasure() != null) {
            product.setUnitOfMeasure(req.unitOfMeasure());
        }
        if (req.unitMeasureCode() != null) {
            product.setUnitMeasureCode(req.unitMeasureCode());
        }
        if (req.packageCode() != null) {
            product.setPackageCode(req.packageCode());
        }
        if (req.soldIndividually() != null) {
            product.setSoldIndividually(req.soldIndividually());
        }
        if (req.markedProduct() != null) {
            product.setMarkedProduct(req.markedProduct());
        }
        if (req.storageLocation() != null) {
            product.setStorageLocation(StringUtils.hasText(req.storageLocation()) ? req.storageLocation().trim() : null);
        }
        if (req.active() != null) {
            product.setActive(req.active());
        }
        if (req.ownerType() != null) {
            product.setOwnerType(req.ownerType());
        }
        if (req.commissionTin() != null) {
            product.setCommissionTin(req.commissionTin());
        }
        if (req.commissionPinfl() != null) {
            product.setCommissionPinfl(req.commissionPinfl());
        }
        if (req.barcode() != null) {
            assertBarcodeUniqueness(req.barcode(), id);
            product.setBarcode(req.barcode());
        }
        if (req.additionalBarcodes() != null) {
            String primary = product.getBarcode();
            assertNoDuplicateBarcodesInRequest(req.additionalBarcodes(), primary);
            assertAdditionalBarcodesUnique(req.additionalBarcodes(), primary, id);
            applyExtraBarcodes(product, req.additionalBarcodes(), primary);
        }
        if (req.storePrices() != null) {
            applyStorePrices(product, req.storePrices());
        }

        return mapProduct(productRepository.save(product), null);
    }

    @Override
    @Transactional
    public ProductResponse adjustStock(UUID id, int quantity, String movementType, String notes) {
        Product product = findById(id);
        applyStockDelta(product, quantity);
        productRepository.save(product);
        recordStockMovement(product, quantity, movementType, notes);
        return mapProduct(product, null);
    }

    @Override
    @Transactional
    public ProductResponse receiveWarehouseStock(WarehouseReceiveRequest req) {
        Product product = findDetailed(req.productId());
        int q = req.quantity();
        if (q < 1) {
            throw new BadRequestException("Quantity must be at least 1");
        }
        applyStockDelta(product, q);
        product.setSellingPrice(req.unitSellingPrice());
        product.setCostPrice(req.purchasePrice());
        if (req.vatPercent() != null) {
            product.setTaxRate(BigDecimal.valueOf(req.vatPercent()));
        }
        product.setMarkedProduct(req.markedProduct());
        if (StringUtils.hasText(req.storageLocation())) {
            product.setStorageLocation(req.storageLocation().trim());
        }
        Product saved = productRepository.save(product);
        recordStockMovement(saved, q, "RESTOCK", "Склад: поступление");
        return mapProduct(saved, null);
    }

    /** Единый остаток: каталог, склад и касса читают product.stock_quantity. */
    private void applyStockDelta(Product product, int delta) {
        int newStock = product.getStockQuantity() + delta;
        if (newStock < 0) {
            throw new BadRequestException("Insufficient stock");
        }
        product.setStockQuantity(newStock);
    }

    private void recordStockMovement(Product product, int quantity, String movementType, String notes) {
        stockMovementRepository.save(StockMovement.builder()
            .product(product)
            .movementType(movementType)
            .quantity(quantity)
            .notes(notes)
            .build());
    }

    @Override
    @Transactional
    public void deactivateProduct(UUID id) {
        Product product = findById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    @Override
    @Transactional
    public int bulkUpdateTaxRate(BulkTaxRateRequest req) {
        List<Product> products = productRepository.findAllById(req.productIds());
        if (products.isEmpty()) {
            throw new BadRequestException("No products found for provided ids");
        }
        for (Product p : products) {
            p.setTaxRate(req.taxRate());
        }
        productRepository.saveAll(products);
        return products.size();
    }

    @Override
    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
            .map(p -> mapProduct(p, null))
            .collect(Collectors.toList());
    }

    @Override
    public List<ProductExportPreviewRow> previewProductsExport(String storeIdsParam, BigDecimal markupPercent) {
        return productExportService.previewExport(storeIdsParam, markupPercent);
    }

    @Override
    public byte[] exportProductsCatalogExcel(ProductExportRequest request) {
        return productExportService.exportCatalogExcel(request);
    }

    @Override
    public byte[] buildImportTemplateExcel() {
        return productExportService.buildImportTemplateExcel();
    }

    @Override
    public ProductImportPreviewResponse previewProductsImport(MultipartFile file, String source) {
        return productImportService.preview(file, source);
    }

    @Override
    public ProductImportResponse importFromFile(MultipartFile file, ProductImportConfirmRequest options) {
        ProductImportResponse result = productImportService.importFile(file, options);
        LogUtil.info(
            ProductServiceImpl.class,
            "Product import finished: created={}, skipped={}, errorCount={}",
            result.created(),
            result.skipped(),
            result.errors().size()
        );
        return result;
    }
}
