package com.pos.util;

import com.pos.domain.ProductQuantityRules;
import com.pos.domain.SaleType;
import com.pos.entity.Product;

import java.math.BigDecimal;

/** Операции со складским количеством (хранение DECIMAL 18,3). */
public final class StockCalculator {

    private StockCalculator() {
    }

    public static boolean tracksStock(Product product) {
        return tracksStock(product != null ? product.getSaleType() : null);
    }

    public static boolean tracksStock(SaleType saleType) {
        return saleType != null && saleType != SaleType.SERVICE;
    }

    public static boolean hasAvailable(BigDecimal stock, BigDecimal requested) {
        return QuantityUtil.compare(stock, requested) >= 0;
    }

    public static BigDecimal decrease(BigDecimal stock, BigDecimal quantity) {
        return QuantityUtil.subtract(stock, quantity);
    }

    public static BigDecimal increase(BigDecimal stock, BigDecimal quantity) {
        return QuantityUtil.add(stock, quantity);
    }

    public static BigDecimal normalizeMovement(BigDecimal quantity, Product product) {
        if (product == null) {
            return QuantityUtil.normalize(quantity);
        }
        return QuantityValidator.normalizeForProduct(ProductQuantityRules.from(product), quantity);
    }
}
