package com.pos.service.product.impl;

import com.pos.dto.product.ProductResponse;
import com.pos.dto.product.UpdateProductRequest;
import com.pos.entity.Category;
import com.pos.entity.Product;
import com.pos.exception.PosExceptions;
import com.pos.repository.CategoryRepository;
import com.pos.repository.ProductRepository;
import com.pos.service.ProductAttributeService;
import com.pos.service.UnitCatalogService;
import com.pos.service.product.ProductExtensionService;
import com.pos.service.product.ProductQuantityRulesResolver;
import com.pos.service.product.ProductResponseAssembler;
import com.pos.service.product.SaleTypeSupport;
import com.pos.service.product.support.ProductBarcodeValidator;
import com.pos.service.product.support.ProductCatalogLoader;
import com.pos.service.product.support.ProductStorePriceApplier;
import com.pos.service.support.ProductValueNormalizer;
import com.pos.util.LogUtil;
import com.pos.util.ProductTemplateCodeValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductUpdateHandler {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductCatalogLoader catalogLoader;
    private final ProductBarcodeValidator barcodeValidator;
    private final ProductStorePriceApplier storePriceApplier;
    private final ProductExtensionService extensionService;
    private final UnitCatalogService unitCatalogService;
    private final ProductAttributeService productAttributeService;
    private final ProductResponseAssembler assembler;

    @Transactional
    public ProductResponse update(UUID id, UpdateProductRequest req) {
        Product product = catalogLoader.requireDetailed(id);
        applyChanges(product, req);
        Product saved = productRepository.save(product);
        if (req.attributes() != null) {
            productAttributeService.saveAttributes(saved.getId(), req.businessTypeCode(), req.attributes());
        }
        LogUtil.info(ProductUpdateHandler.class, "Product updated: id={}", id);
        return assembler.toResponse(saved);
    }

    private void applyChanges(Product product, UpdateProductRequest req) {
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
            Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> PosExceptions.notFound("Category", req.categoryId()));
            product.setCategory(category);
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
            barcodeValidator.assertUnique(product.getCompany().getId(), req.barcode(), product.getId());
            product.setBarcode(req.barcode());
        }
        if (req.additionalBarcodes() != null) {
            String primary = product.getBarcode();
            barcodeValidator.validateForUpdate(
                product.getCompany().getId(), primary, req.additionalBarcodes(), product.getId()
            );
            storePriceApplier.applyExtraBarcodes(product, req.additionalBarcodes(), primary);
        }
        if (req.storePrices() != null && !req.storePrices().isEmpty()) {
            storePriceApplier.applyStorePrices(product, req.storePrices());
        } else if (req.sellingPrice() != null) {
            storePriceApplier.syncWithSellingPrice(product, previousSelling, req.sellingPrice());
        }
        extensionService.applyOnUpdate(product, req);
    }
}
