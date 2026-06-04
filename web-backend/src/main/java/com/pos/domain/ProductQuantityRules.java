package com.pos.domain;

import com.pos.entity.Product;

/**
 * Правила количества для товара: тип продажи, единица, точность, дробность.
 */
public record ProductQuantityRules(
    SaleType saleType,
    UnitCode unitCode,
    int quantityScale,
    boolean allowFraction
) {

    public static ProductQuantityRules from(Product product) {
        if (product == null) {
            return new ProductQuantityRules(SaleType.PIECE, UnitCode.PCS, 0, false);
        }
        return new ProductQuantityRules(
            product.getSaleType() != null ? product.getSaleType() : SaleType.PIECE,
            product.getUnitCode() != null ? product.getUnitCode() : UnitCode.PCS,
            product.getQuantityScale(),
            product.isAllowFraction()
        );
    }

    public String displayUnitLabel() {
        return unitCode != null ? unitCode.displayLabel() : UnitCode.PCS.displayLabel();
    }
}
