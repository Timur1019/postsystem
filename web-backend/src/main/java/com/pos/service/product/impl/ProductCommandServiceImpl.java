package com.pos.service.product.impl;

import com.pos.dto.product.BulkTaxRateRequest;
import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.ProductResponse;
import com.pos.dto.product.UpdateProductRequest;
import com.pos.entity.Product;
import com.pos.exception.PosExceptions;
import com.pos.repository.ProductRepository;
import com.pos.service.product.ProductCommandService;
import com.pos.service.product.support.ProductCatalogLoader;
import com.pos.service.support.ProductValueNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class ProductCommandServiceImpl implements ProductCommandService {

    private final ProductCreateHandler createHandler;
    private final ProductUpdateHandler updateHandler;
    private final ProductCatalogLoader catalogLoader;
    private final ProductRepository productRepository;

    @Override
    public ProductResponse createProduct(CreateProductRequest req) {
        return createHandler.create(req);
    }

    @Override
    public ProductResponse updateProduct(UUID id, UpdateProductRequest req) {
        return updateHandler.update(id, req);
    }

    @Override
    public void deactivateProduct(UUID id) {
        Product product = catalogLoader.requireById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    @Override
    public int bulkUpdateTaxRate(BulkTaxRateRequest req) {
        List<Product> products = productRepository.findAllById(req.productIds());
        if (products.isEmpty()) {
            throw PosExceptions.badRequest("No products found for provided ids");
        }
        for (Product product : products) {
            product.setTaxRate(ProductValueNormalizer.taxRatePercent(req.taxRate()));
        }
        productRepository.saveAll(products);
        return products.size();
    }

    @Override
    public int bulkDeactivateProducts(List<UUID> productIds) {
        List<Product> products = productRepository.findAllById(productIds);
        if (products.isEmpty()) {
            throw PosExceptions.badRequest("No products found for provided ids");
        }
        int updated = 0;
        for (Product product : products) {
            if (product.isActive()) {
                product.setActive(false);
                updated++;
            }
        }
        productRepository.saveAll(products);
        return updated;
    }
}
