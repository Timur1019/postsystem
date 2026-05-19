package com.pos.service.product;

import com.pos.dto.product.BulkTaxRateRequest;
import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.ProductResponse;
import com.pos.dto.product.UpdateProductRequest;

import java.util.List;
import java.util.UUID;

public interface ProductCommandService {

    ProductResponse createProduct(CreateProductRequest req);

    ProductResponse updateProduct(UUID id, UpdateProductRequest req);

    void deactivateProduct(UUID id);

    int bulkUpdateTaxRate(BulkTaxRateRequest req);

    int bulkDeactivateProducts(List<UUID> productIds);
}
