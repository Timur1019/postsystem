package com.pos.service.product.impl;

import com.pos.dto.product.BulkTaxRateRequest;
import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.ProductResponse;
import com.pos.dto.product.ProductStorePriceRequest;
import com.pos.dto.product.UpdateProductRequest;
import com.pos.entity.Category;
import com.pos.entity.Product;
import com.pos.entity.StockMovement;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.CategoryRepository;
import com.pos.repository.ProductBarcodeRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.ProductStorePriceRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.repository.StoreRepository;
import com.pos.service.product.ProductCommandService;
import com.pos.service.product.ProductExtensionService;
import com.pos.service.product.ProductResponseAssembler;
import com.pos.service.product.ProductQuantityRulesResolver;
import com.pos.service.product.SaleTypeSupport;
import com.pos.service.support.AbstractProductCatalogSupport;
import com.pos.service.support.ProductValueNormalizer;
import com.pos.service.support.ProductLookupSupport;
import com.pos.service.support.TenantAccessSupport;
import com.pos.repository.spec.ProductSpecifications;
import com.pos.service.UnitCatalogService;
import com.pos.service.stock.StoreStockService;
import com.pos.util.ProductTemplateCodeValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pos.entity.ProductStorePrice;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class ProductCommandServiceImpl extends AbstractProductCatalogSupport implements ProductCommandService {

    private final StockMovementRepository stockMovementRepository;
    private final ProductResponseAssembler assembler;
    private final ProductExtensionService extensionService;
    private final TenantAccessSupport tenantAccess;
    private final StoreStockService storeStockService;
    private final UnitCatalogService unitCatalogService;

    public ProductCommandServiceImpl(
        ProductRepository productRepository,
        ProductLookupSupport productLookup,
        CategoryRepository categoryRepository,
        ProductBarcodeRepository productBarcodeRepository,
        ProductStorePriceRepository productStorePriceRepository,
        StoreRepository storeRepository,
        StockMovementRepository stockMovementRepository,
        ProductResponseAssembler assembler,
        ProductExtensionService extensionService,
        TenantAccessSupport tenantAccess,
        StoreStockService storeStockService,
        UnitCatalogService unitCatalogService
    ) {
        super(productRepository, productLookup, categoryRepository, productBarcodeRepository, productStorePriceRepository, storeRepository);
        this.stockMovementRepository = stockMovementRepository;
        this.assembler = assembler;
        this.extensionService = extensionService;
        this.tenantAccess = tenantAccess;
        this.storeStockService = storeStockService;
        this.unitCatalogService = unitCatalogService;
    }

    @Override
    public ProductResponse createProduct(CreateProductRequest req) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        if (!StringUtils.hasText(req.uzInvoiceDocumentId())) {
            Optional<Product> bySku = productLookup.findOne(
                ProductSpecifications.lookup(companyId).sku(req.sku()).anyActiveState()
            );
            if (bySku.isPresent()) {
                if (bySku.get().isActive()) {
                    throw new BadRequestException("SKU already exists: " + req.sku());
                }
                return reactivateFromCreate(req, bySku.get());
            }
        } else {
            Optional<Product> bySku = productLookup.findOne(
                ProductSpecifications.lookup(companyId).sku(req.sku()).anyActiveState()
            );
            if (bySku.isPresent() && !bySku.get().isActive()) {
                return reactivateFromCreate(req, bySku.get());
            }
        }

        Category category = req.categoryId() != null
            ? categoryRepository.findById(req.categoryId())
                .filter(c -> c.getCompany().getId().equals(companyId))
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"))
            : null;

        assertBarcodeUniqueness(companyId, req.barcode(), null);
        assertNoDuplicateBarcodesInRequest(req.additionalBarcodes(), req.barcode());
        assertAdditionalBarcodesUnique(companyId, req.additionalBarcodes(), req.barcode(), null);

        Product product = Product.builder()
            .company(tenantAccess.requireCompany(companyId))
            .sku(req.sku())
            .name(req.name())
            .description(req.description())
            .category(category)
            .costPrice(req.costPrice())
            .sellingPrice(req.sellingPrice())
            .defaultDiscountPercent(ProductValueNormalizer.discountPercent(req.defaultDiscountPercent()))
            .taxRate(ProductValueNormalizer.taxRatePercent(req.taxRate()))
            .stockQuantity(BigDecimal.ZERO)
            .lowStockAlert(req.lowStockAlert() != null ? req.lowStockAlert() : 10)
            .barcode(req.barcode())
            .imageUrl(req.imageUrl())
            .isActive(true)
            .externalProductId(req.externalProductId())
            .ikpu(req.ikpu())
            .ikpuStatus(StringUtils.hasText(req.ikpuStatus()) ? req.ikpuStatus() : "UNKNOWN")
            .unitOfMeasure(
                SaleTypeSupport.defaultUnitOfMeasure(
                    SaleTypeSupport.resolve(req.saleType(), req.unitOfMeasure()),
                    req.unitOfMeasure()
                )
            )
            .unitMeasureCode(req.unitMeasureCode())
            .packageCode(req.packageCode())
            .storageLocation(StringUtils.hasText(req.storageLocation()) ? req.storageLocation().trim() : null)
            .ownerType(StringUtils.hasText(req.ownerType()) ? req.ownerType() : "OWN")
            .commissionTin(req.commissionTin())
            .commissionPinfl(req.commissionPinfl())
            .uzInvoiceDocumentId(
                StringUtils.hasText(req.uzInvoiceDocumentId()) ? req.uzInvoiceDocumentId().trim().toUpperCase() : null
            )
            .build();
        ProductQuantityRulesResolver.applyTo(
            product,
            req.saleType(),
            req.unitCode(),
            req.quantityScale(),
            req.allowFraction(),
            req.unitOfMeasure()
        );
        unitCatalogService.requireStockUnit(product.getUnitCode());
        if (!org.springframework.util.StringUtils.hasText(product.getUnitOfMeasure())) {
            product.setUnitOfMeasure(SaleTypeSupport.defaultUnitOfMeasure(product.getSaleType(), req.unitOfMeasure()));
        }
        extensionService.applyOnCreate(product, req);
        product.setTemplateCode(ProductTemplateCodeValidator.normalizeOrNull(req.templateCode()));

        Product saved = productRepository.save(product);
        applyStorePrices(saved, req.storePrices());
        applyExtraBarcodes(saved, req.additionalBarcodes(), saved.getBarcode());
        Product persisted = productRepository.save(saved);
        applyInitialStock(persisted, req.initialStock(), req.storePrices(), companyId, "Начальный остаток при создании товара");
        return assembler.toResponse(persisted);
    }

    @Override
    public ProductResponse updateProduct(UUID id, UpdateProductRequest req) {
        Product product = findDetailed(id);
        applyUpdates(product, req);
        return assembler.toResponse(productRepository.save(product));
    }

    @Override
    public void deactivateProduct(UUID id) {
        Product product = findById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    @Override
    public int bulkUpdateTaxRate(BulkTaxRateRequest req) {
        List<Product> products = productRepository.findAllById(req.productIds());
        if (products.isEmpty()) {
            throw new BadRequestException("No products found for provided ids");
        }
        for (Product p : products) {
            p.setTaxRate(ProductValueNormalizer.taxRatePercent(req.taxRate()));
        }
        productRepository.saveAll(products);
        return products.size();
    }

    @Override
    public int bulkDeactivateProducts(List<UUID> productIds) {
        List<Product> products = productRepository.findAllById(productIds);
        if (products.isEmpty()) {
            throw new BadRequestException("No products found for provided ids");
        }
        int updated = 0;
        for (Product p : products) {
            if (p.isActive()) {
                p.setActive(false);
                updated++;
            }
        }
        productRepository.saveAll(products);
        return updated;
    }

    private void applyUpdates(Product product, UpdateProductRequest req) {
        if (StringUtils.hasText(req.name())) {
            product.setName(req.name());
        }
        if (req.description() != null) {
            product.setDescription(req.description());
        }
        BigDecimal previousSelling = product.getSellingPrice();
        if (req.sellingPrice() != null) {
            product.setSellingPrice(req.sellingPrice());
        }
        if (req.defaultDiscountPercent() != null) {
            product.setDefaultDiscountPercent(ProductValueNormalizer.discountPercent(req.defaultDiscountPercent()));
        }
        if (req.costPrice() != null) {
            product.setCostPrice(req.costPrice());
        }
        if (req.taxRate() != null) {
            product.setTaxRate(ProductValueNormalizer.taxRatePercent(req.taxRate()));
        }
        if (req.templateCode() != null) {
            product.setTemplateCode(ProductTemplateCodeValidator.normalizeOrNull(req.templateCode()));
        }
        if (req.saleType() != null || req.unitCode() != null || req.quantityScale() != null || req.allowFraction() != null) {
            ProductQuantityRulesResolver.applyTo(
                product,
                req.saleType() != null ? req.saleType() : product.getSaleType(),
                req.unitCode(),
                req.quantityScale(),
                req.allowFraction(),
                req.unitOfMeasure() != null ? req.unitOfMeasure() : product.getUnitOfMeasure()
            );
            if (req.unitOfMeasure() == null) {
                product.setUnitOfMeasure(SaleTypeSupport.defaultUnitOfMeasure(product.getSaleType(), null));
            }
            unitCatalogService.requireStockUnit(product.getUnitCode());
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
            assertBarcodeUniqueness(product.getCompany().getId(), req.barcode(), product.getId());
            product.setBarcode(req.barcode());
        }
        if (req.additionalBarcodes() != null) {
            String primary = product.getBarcode();
            assertNoDuplicateBarcodesInRequest(req.additionalBarcodes(), primary);
            assertAdditionalBarcodesUnique(
                product.getCompany().getId(), req.additionalBarcodes(), primary, product.getId()
            );
            applyExtraBarcodes(product, req.additionalBarcodes(), primary);
        }
        if (req.storePrices() != null && !req.storePrices().isEmpty()) {
            applyStorePrices(product, req.storePrices());
        } else if (req.sellingPrice() != null) {
            syncStorePricesWithSelling(product, previousSelling, req.sellingPrice());
        }
        extensionService.applyOnUpdate(product, req);
    }

    /**
     * Если в запросе нет цен по магазинам, обновляет привязанные цены,
     * совпадавшие с прежней ценой продажи или с себестоимостью.
     */
    private void syncStorePricesWithSelling(Product product, BigDecimal oldSelling, BigDecimal newSelling) {
        if (newSelling == null || product.getStorePrices() == null) {
            return;
        }
        BigDecimal cost = product.getCostPrice();
        for (ProductStorePrice line : product.getStorePrices()) {
            BigDecimal price = line.getPrice();
            if (price == null) {
                line.setPrice(newSelling);
                continue;
            }
            boolean matchedOld = oldSelling != null && price.compareTo(oldSelling) == 0;
            boolean matchedCost = cost != null
                && price.compareTo(cost) == 0
                && cost.compareTo(newSelling) != 0;
            if (matchedOld || matchedCost) {
                line.setPrice(newSelling);
            }
        }
    }

    private ProductResponse reactivateFromCreate(CreateProductRequest req, Product product) {
        Category category = req.categoryId() != null
            ? categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"))
            : null;

        assertBarcodeUniqueness(product.getCompany().getId(), req.barcode(), product.getId());
        assertNoDuplicateBarcodesInRequest(req.additionalBarcodes(), req.barcode());
        assertAdditionalBarcodesUnique(
            product.getCompany().getId(), req.additionalBarcodes(), req.barcode(), product.getId()
        );

        product.setName(req.name());
        product.setDescription(req.description());
        product.setCategory(category);
        product.setCostPrice(req.costPrice());
        product.setSellingPrice(req.sellingPrice());
        product.setDefaultDiscountPercent(ProductValueNormalizer.discountPercent(req.defaultDiscountPercent()));
        product.setTaxRate(ProductValueNormalizer.taxRatePercent(req.taxRate()));
        product.setLowStockAlert(req.lowStockAlert() != null ? req.lowStockAlert() : 10);
        product.setBarcode(req.barcode());
        product.setImageUrl(req.imageUrl());
        product.setActive(true);
        product.setExternalProductId(req.externalProductId());
        product.setIkpu(req.ikpu());
        product.setIkpuStatus(StringUtils.hasText(req.ikpuStatus()) ? req.ikpuStatus() : "UNKNOWN");
        product.setUnitOfMeasure(StringUtils.hasText(req.unitOfMeasure()) ? req.unitOfMeasure() : "pcs");
        product.setUnitMeasureCode(req.unitMeasureCode());
        product.setPackageCode(req.packageCode());
        product.setStorageLocation(StringUtils.hasText(req.storageLocation()) ? req.storageLocation().trim() : null);
        product.setOwnerType(StringUtils.hasText(req.ownerType()) ? req.ownerType() : "OWN");
        product.setCommissionTin(req.commissionTin());
        product.setCommissionPinfl(req.commissionPinfl());
        product.setUzInvoiceDocumentId(
            StringUtils.hasText(req.uzInvoiceDocumentId()) ? req.uzInvoiceDocumentId().trim().toUpperCase() : null
        );

        BigDecimal initialStock = req.initialStock() != null
            ? com.pos.util.QuantityUtil.normalize(req.initialStock())
            : BigDecimal.ZERO;
        ProductQuantityRulesResolver.applyTo(
            product,
            req.saleType(),
            req.unitCode(),
            req.quantityScale(),
            req.allowFraction(),
            req.unitOfMeasure()
        );
        product.setStockQuantity(BigDecimal.ZERO);
        extensionService.applyOnCreate(product, req);
        product.setTemplateCode(ProductTemplateCodeValidator.normalizeOrNull(req.templateCode()));

        Product saved = productRepository.save(product);
        applyStorePrices(saved, req.storePrices());
        applyExtraBarcodes(saved, req.additionalBarcodes(), saved.getBarcode());
        Product persisted = productRepository.save(saved);
        Integer companyId = persisted.getCompany() != null ? persisted.getCompany().getId() : null;
        applyInitialStock(persisted, initialStock, req.storePrices(), companyId, "Начальный остаток при повторном импорте");
        return assembler.toResponse(persisted);
    }

    private void applyInitialStock(
        Product product,
        BigDecimal initialStockRaw,
        List<ProductStorePriceRequest> storePrices,
        Integer companyId,
        String movementNote
    ) {
        BigDecimal initialStock = initialStockRaw != null
            ? com.pos.util.QuantityUtil.normalize(initialStockRaw)
            : BigDecimal.ZERO;
        if (initialStock.signum() <= 0 || companyId == null || !com.pos.util.StockCalculator.tracksStock(product)) {
            return;
        }
        com.pos.util.QuantityValidator.validate(product, initialStock);
        List<Integer> targetStoreIds = new java.util.ArrayList<>();
        if (storePrices != null && !storePrices.isEmpty()) {
            storePrices.stream().map(ProductStorePriceRequest::storeId).distinct().forEach(targetStoreIds::add);
        } else {
            List<com.pos.entity.Store> stores = storeRepository.findByCompanyIdOrderByNameAsc(companyId);
            if (stores.size() == 1) {
                targetStoreIds.add(stores.get(0).getId());
            } else if (stores.size() > 1) {
                throw new BadRequestException(
                    "Укажите цены по магазинам (storePrices), чтобы задать начальный остаток при нескольких магазинах"
                );
            }
        }
        for (Integer storeId : targetStoreIds) {
            com.pos.entity.Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found: " + storeId));
            storeStockService.initializeForStore(product, store, initialStock);
            recordStockMovement(product, initialStock, "RESTOCK", movementNote, store);
        }
    }

    private void recordStockMovement(
        Product product,
        BigDecimal quantity,
        String movementType,
        String notes,
        com.pos.entity.Store store
    ) {
        stockMovementRepository.save(StockMovement.builder()
            .product(product)
            .store(store)
            .movementType(movementType)
            .quantity(com.pos.util.QuantityUtil.normalize(quantity))
            .notes(notes)
            .build());
    }
}
