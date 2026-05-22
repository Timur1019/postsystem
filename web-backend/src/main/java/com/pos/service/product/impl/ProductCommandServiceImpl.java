package com.pos.service.product.impl;

import com.pos.dto.product.BulkTaxRateRequest;
import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.ProductResponse;
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
import com.pos.service.product.ProductResponseAssembler;
import com.pos.service.support.AbstractProductCatalogSupport;
import com.pos.service.support.ProductValueNormalizer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class ProductCommandServiceImpl extends AbstractProductCatalogSupport implements ProductCommandService {

    private final StockMovementRepository stockMovementRepository;
    private final ProductResponseAssembler assembler;

    public ProductCommandServiceImpl(
        ProductRepository productRepository,
        CategoryRepository categoryRepository,
        ProductBarcodeRepository productBarcodeRepository,
        ProductStorePriceRepository productStorePriceRepository,
        StoreRepository storeRepository,
        StockMovementRepository stockMovementRepository,
        ProductResponseAssembler assembler
    ) {
        super(productRepository, categoryRepository, productBarcodeRepository, productStorePriceRepository, storeRepository);
        this.stockMovementRepository = stockMovementRepository;
        this.assembler = assembler;
    }

    @Override
    public ProductResponse createProduct(CreateProductRequest req) {
        if (!StringUtils.hasText(req.uzInvoiceDocumentId())) {
            Optional<Product> bySku = productRepository.findBySku(req.sku());
            if (bySku.isPresent()) {
                if (bySku.get().isActive()) {
                    throw new BadRequestException("SKU already exists: " + req.sku());
                }
                return reactivateFromCreate(req, bySku.get());
            }
        } else {
            Optional<Product> bySku = productRepository.findBySku(req.sku());
            if (bySku.isPresent() && !bySku.get().isActive()) {
                return reactivateFromCreate(req, bySku.get());
            }
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
            .defaultDiscountPercent(ProductValueNormalizer.discountPercent(req.defaultDiscountPercent()))
            .taxRate(ProductValueNormalizer.taxRatePercent(req.taxRate()))
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
            .storageLocation(StringUtils.hasText(req.storageLocation()) ? req.storageLocation().trim() : null)
            .ownerType(StringUtils.hasText(req.ownerType()) ? req.ownerType() : "OWN")
            .commissionTin(req.commissionTin())
            .commissionPinfl(req.commissionPinfl())
            .uzInvoiceDocumentId(
                StringUtils.hasText(req.uzInvoiceDocumentId()) ? req.uzInvoiceDocumentId().trim().toUpperCase() : null
            )
            .build();

        Product saved = productRepository.save(product);
        applyStorePrices(saved, req.storePrices());
        applyExtraBarcodes(saved, req.additionalBarcodes(), saved.getBarcode());
        saved = productRepository.save(saved);
        int initialStock = req.initialStock() != null ? req.initialStock() : 0;
        if (initialStock > 0) {
            recordStockMovement(saved, initialStock, "RESTOCK", "Начальный остаток при создании товара");
        }
        return assembler.toResponse(saved);
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
            assertBarcodeUniqueness(req.barcode(), product.getId());
            product.setBarcode(req.barcode());
        }
        if (req.additionalBarcodes() != null) {
            String primary = product.getBarcode();
            assertNoDuplicateBarcodesInRequest(req.additionalBarcodes(), primary);
            assertAdditionalBarcodesUnique(req.additionalBarcodes(), primary, product.getId());
            applyExtraBarcodes(product, req.additionalBarcodes(), primary);
        }
        if (req.storePrices() != null) {
            applyStorePrices(product, req.storePrices());
        }
    }

    private ProductResponse reactivateFromCreate(CreateProductRequest req, Product product) {
        Category category = req.categoryId() != null
            ? categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"))
            : null;

        assertBarcodeUniqueness(req.barcode(), product.getId());
        assertNoDuplicateBarcodesInRequest(req.additionalBarcodes(), req.barcode());
        assertAdditionalBarcodesUnique(req.additionalBarcodes(), req.barcode(), product.getId());

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
        product.setSoldIndividually(req.soldIndividually() == null || req.soldIndividually());
        product.setMarkedProduct(Boolean.TRUE.equals(req.markedProduct()));
        product.setStorageLocation(StringUtils.hasText(req.storageLocation()) ? req.storageLocation().trim() : null);
        product.setOwnerType(StringUtils.hasText(req.ownerType()) ? req.ownerType() : "OWN");
        product.setCommissionTin(req.commissionTin());
        product.setCommissionPinfl(req.commissionPinfl());
        product.setUzInvoiceDocumentId(
            StringUtils.hasText(req.uzInvoiceDocumentId()) ? req.uzInvoiceDocumentId().trim().toUpperCase() : null
        );

        int initialStock = req.initialStock() != null ? req.initialStock() : 0;
        product.setStockQuantity(initialStock);

        Product saved = productRepository.save(product);
        applyStorePrices(saved, req.storePrices());
        applyExtraBarcodes(saved, req.additionalBarcodes(), saved.getBarcode());
        saved = productRepository.save(saved);
        if (initialStock > 0) {
            recordStockMovement(saved, initialStock, "RESTOCK", "Начальный остаток при повторном импорте");
        }
        return assembler.toResponse(saved);
    }

    private void recordStockMovement(Product product, int quantity, String movementType, String notes) {
        stockMovementRepository.save(StockMovement.builder()
            .product(product)
            .movementType(movementType)
            .quantity(quantity)
            .notes(notes)
            .build());
    }
}
