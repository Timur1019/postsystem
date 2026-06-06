package com.pos.service.product;

import com.pos.entity.Product;

/** Чтение розничных флагов: extension приоритетнее legacy-колонок products. */
public final class ProductRetailFields {

    private ProductRetailFields() {
    }

    public static boolean markedProduct(Product product) {
        if (product == null) {
            return false;
        }
        if (product.getRetailDetails() != null) {
            return product.getRetailDetails().isMarkedProduct();
        }
        return product.isMarkedProduct();
    }

    public static boolean soldIndividually(Product product) {
        if (product == null) {
            return true;
        }
        if (product.getRetailDetails() != null) {
            return product.getRetailDetails().isSoldIndividually();
        }
        return product.isSoldIndividually();
    }
}
