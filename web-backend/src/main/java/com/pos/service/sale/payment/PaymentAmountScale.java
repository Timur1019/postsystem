package com.pos.service.sale.payment;

import java.math.BigDecimal;
import java.math.RoundingMode;

final class PaymentAmountScale {

    private PaymentAmountScale() {
    }

    static BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
