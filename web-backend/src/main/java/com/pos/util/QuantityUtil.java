package com.pos.util;

import com.pos.domain.SaleType;
import java.math.BigDecimal;
import java.math.RoundingMode;

public final class QuantityUtil {

    public static final int SCALE = 3;

    private QuantityUtil() {
    }

    public static BigDecimal normalize(BigDecimal quantity) {
        if (quantity == null) {
            return BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        }
        return quantity.setScale(SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal normalizeFromNumber(Number quantity) {
        if (quantity == null) {
            return BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        }
        if (quantity instanceof BigDecimal bd) {
            return normalize(bd);
        }
        return normalize(BigDecimal.valueOf(quantity.doubleValue()));
    }

    public static boolean tracksStock(SaleType saleType) {
        return StockCalculator.tracksStock(saleType);
    }

    /** @deprecated используйте {@link QuantityValidator#validate(com.pos.entity.Product, BigDecimal)} */
    @Deprecated
    public static void validateForSale(SaleType saleType, BigDecimal rawQuantity) {
        QuantityValidator.validate(
            com.pos.service.product.ProductQuantityRulesResolver.defaults(saleType),
            rawQuantity
        );
    }

    public static boolean isWholeUnit(BigDecimal q) {
        return QuantityValidator.isWholeUnit(q);
    }

    public static BigDecimal add(BigDecimal a, BigDecimal b) {
        return normalize(a).add(normalize(b));
    }

    public static BigDecimal subtract(BigDecimal a, BigDecimal b) {
        return normalize(a).subtract(normalize(b));
    }

    public static int compare(BigDecimal a, BigDecimal b) {
        return normalize(a).compareTo(normalize(b));
    }
}
