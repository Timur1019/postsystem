package com.pos.service.product.impl;

import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.ProductResponse;
import com.pos.entity.Category;
import com.pos.entity.Product;
import com.pos.exception.PosExceptions;
import com.pos.repository.CategoryRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.spec.ProductSpecifications;
import com.pos.service.ProductAttributeService;
import com.pos.service.UnitCatalogService;
import com.pos.service.product.ProductExtensionService;
import com.pos.service.product.ProductQuantityRulesResolver;
import com.pos.service.product.ProductResponseAssembler;
import com.pos.service.product.SaleTypeSupport;
import com.pos.service.product.support.ProductBarcodeValidator;
import com.pos.service.product.support.ProductInitialStockSupport;
import com.pos.service.product.support.ProductStorePriceApplier;
import com.pos.service.support.ProductLookupSupport;
import com.pos.service.support.ProductValueNormalizer;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.LogUtil;
import com.pos.util.ProductTemplateCodeValidator;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductCreateHandler {

    private final ProductRepository productRepository;
    private final ProductLookupSupport productLookup;
    private final CategoryRepository categoryRepository;
    private final TenantAccessSupport tenantAccess;
    private final ProductBarcodeValidator barcodeValidator;
    private final ProductStorePriceApplier storePriceApplier;
    private final ProductInitialStockSupport initialStockSupport;
    private final ProductExtensionService extensionService;
    private final UnitCatalogService unitCatalogService;
    private final ProductAttributeService productAttributeService;
    private final ProductResponseAssembler assembler;

    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Optional<Product> inactiveBySku = productLookup.findOne(
            ProductSpecifications.lookup(companyId).sku(req.sku()).anyActiveState()
        );

        if (inactiveBySku.isPresent() && !inactiveBySku.get().isActive()) {
            return reactivate(req, inactiveBySku.get());
        }
        if (inactiveBySku.isPresent() && inactiveBySku.get().isActive() && !StringUtils.hasText(req.uzInvoiceDocumentId())) {
            throw PosExceptions.badRequest("SKU already exists: " + req.sku(), "sku", req.sku());
        }

        Category category = resolveCategory(req.categoryId(), companyId);
        barcodeValidator.validateForCreate(companyId, req.barcode(), req.additionalBarcodes());

        Product product = buildNewProduct(req, companyId, category);
        Product saved = productRepository.save(product);
        storePriceApplier.applyStorePrices(saved, req.storePrices());
        storePriceApplier.applyExtraBarcodes(saved, req.additionalBarcodes(), saved.getBarcode());
        Product persisted = productRepository.save(saved);

        initialStockSupport.applyIfPresent(
            persisted, req.initialStock(), req.storePrices(), companyId, "Начальный остаток при создании товара"
        );
        productAttributeService.saveAttributes(persisted.getId(), req.businessTypeCode(), req.attributes());

        LogUtil.info(ProductCreateHandler.class, "Product created: id={}, sku={}", persisted.getId(), persisted.getSku());
        return assembler.toResponse(persisted);
    }

    private ProductResponse reactivate(CreateProductRequest req, Product product) {
        Integer companyId = product.getCompany().getId();
        Category category = resolveCategory(req.categoryId(), companyId);
        barcodeValidator.validateForUpdate(companyId, req.barcode(), req.additionalBarcodes(), product.getId());

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

        BigDecimal initialStock = req.initialStock() != null ? QuantityUtil.normalize(req.initialStock()) : BigDecimal.ZERO;
        ProductQuantityRulesResolver.applyTo(
            product, req.saleType(), req.unitCode(), req.quantityScale(), req.allowFraction(), req.unitOfMeasure()
        );
        product.setStockQuantity(BigDecimal.ZERO);
        extensionService.applyOnCreate(product, req);
        product.setTemplateCode(ProductTemplateCodeValidator.normalizeOrNull(req.templateCode()));

        Product saved = productRepository.save(product);
        storePriceApplier.applyStorePrices(saved, req.storePrices());
        storePriceApplier.applyExtraBarcodes(saved, req.additionalBarcodes(), saved.getBarcode());
        Product persisted = productRepository.save(saved);

        initialStockSupport.applyIfPresent(
            persisted, initialStock, req.storePrices(), companyId, "Начальный остаток при повторном импорте"
        );

        LogUtil.info(ProductCreateHandler.class, "Product reactivated: id={}, sku={}", persisted.getId(), persisted.getSku());
        return assembler.toResponse(persisted);
    }

    private Product buildNewProduct(CreateProductRequest req, Integer companyId, Category category) {
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
            product, req.saleType(), req.unitCode(), req.quantityScale(), req.allowFraction(), req.unitOfMeasure()
        );
        unitCatalogService.requireStockUnit(product.getUnitCode());
        if (!StringUtils.hasText(product.getUnitOfMeasure())) {
            product.setUnitOfMeasure(SaleTypeSupport.defaultUnitOfMeasure(product.getSaleType(), req.unitOfMeasure()));
        }
        extensionService.applyOnCreate(product, req);
        product.setTemplateCode(ProductTemplateCodeValidator.normalizeOrNull(req.templateCode()));
        return product;
    }

    private Category resolveCategory(Integer categoryId, Integer companyId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findById(categoryId)
            .filter(category -> category.getCompany().getId().equals(companyId))
            .orElseThrow(() -> PosExceptions.notFound("Category", categoryId));
    }
}
