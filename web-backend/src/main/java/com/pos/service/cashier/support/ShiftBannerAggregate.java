package com.pos.service.cashier.support;

import java.math.BigDecimal;

public record ShiftBannerAggregate(
    int saleCount,
    BigDecimal totalAmount,
    BigDecimal vatAmount,
    BigDecimal discountTotal,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    BigDecimal lineDiscountTotal,
    BigDecimal orderDiscountTotal,
    BigDecimal humoAmount,
    BigDecimal uzcardAmount,
    BigDecimal cashlessAmount
) {
    public static ShiftBannerAggregate empty() {
        return new ShiftBannerAggregate(
            0,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO
        );
    }

    public boolean isEmpty() {
        return saleCount == 0 && totalAmount.signum() == 0;
    }
}
