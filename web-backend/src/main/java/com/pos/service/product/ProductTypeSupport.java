package com.pos.service.product;

import com.pos.domain.ProductType;
import com.pos.domain.SaleType;

public final class ProductTypeSupport {

    private ProductTypeSupport() {
    }

    public static ProductType resolve(ProductType requested, SaleType saleType) {
        if (requested != null) {
            return requested;
        }
        if (saleType == SaleType.SERVICE) {
            return ProductType.SERVICE;
        }
        return ProductType.RETAIL;
    }
}
