package com.pos.service.cashier.support;

import java.math.BigDecimal;

public record ShiftReturnsAggregate(
    int returnsCount,
    BigDecimal returnsVat,
    BigDecimal returnsCash,
    BigDecimal returnsCard,
    BigDecimal returnsHumo,
    BigDecimal returnsUzcard,
    BigDecimal returnsCashless
) {
    public static ShiftReturnsAggregate empty() {
        return new ShiftReturnsAggregate(
            0,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO
        );
    }

    public boolean hasReturns() {
        return returnsCount > 0
            || returnsVat.signum() != 0
            || returnsCash.signum() != 0
            || returnsCard.signum() != 0
            || returnsHumo.signum() != 0
            || returnsUzcard.signum() != 0
            || returnsCashless.signum() != 0;
    }
}
