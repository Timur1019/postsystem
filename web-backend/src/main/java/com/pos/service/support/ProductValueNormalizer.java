package com.pos.service.support;

import com.pos.util.ProductImportParseUtil;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Нормализация полей товара (скидка %, НДС %). */
public final class ProductValueNormalizer {

    private ProductValueNormalizer() {
    }

    public static BigDecimal discountPercent(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO;
        }
        if (value.compareTo(new BigDecimal("100")) > 0) {
            return new BigDecimal("100");
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal taxRatePercent(BigDecimal value) {
        return ProductImportParseUtil.normalizeTaxRatePercent(value);
    }
}
