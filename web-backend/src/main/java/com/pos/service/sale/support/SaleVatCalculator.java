package com.pos.service.sale.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** НДС внутри суммы: amount × rate / (100 + rate). */
public final class SaleVatCalculator {

    private SaleVatCalculator() {
    }

    public static BigDecimal extractFromInclusive(BigDecimal inclusiveAmount, BigDecimal ratePercent) {
        if (inclusiveAmount == null || inclusiveAmount.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal rate = ratePercent != null ? ratePercent : BigDecimal.ZERO;
        if (rate.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        return inclusiveAmount
            .multiply(rate)
            .divide(rate.add(BigDecimal.valueOf(100)), 8, RoundingMode.HALF_UP);
    }
}
