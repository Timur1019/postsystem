package com.pos.util;

import com.pos.service.sale.support.SaleVatCalculator;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Суммы строк и чека (деньги NUMERIC 18,2). */
public final class MoneyCalculator {

    public static final int SCALE = 2;

    private MoneyCalculator() {
    }

    public static BigDecimal round(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        }
        return value.setScale(SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal lineGrossBeforeDiscount(BigDecimal unitPrice, BigDecimal quantity) {
        BigDecimal price = unitPrice != null ? unitPrice : BigDecimal.ZERO;
        BigDecimal qty = QuantityUtil.normalize(quantity);
        return round(price.multiply(qty));
    }

    public static BigDecimal lineGross(BigDecimal unitPrice, BigDecimal quantity, BigDecimal lineDiscount) {
        BigDecimal gross = lineGrossBeforeDiscount(unitPrice, quantity);
        BigDecimal discount = lineDiscount != null ? lineDiscount : BigDecimal.ZERO;
        return round(gross.subtract(discount).max(BigDecimal.ZERO));
    }

    public static BigDecimal vatFromInclusiveLine(BigDecimal inclusiveLineTotal, BigDecimal taxRatePercent) {
        return round(SaleVatCalculator.extractFromInclusive(inclusiveLineTotal, taxRatePercent));
    }
}
