package com.pos.service.sale.payment;

import com.pos.dto.sale.CreateSaleRequest;
import com.pos.entity.Sale;
import com.pos.service.sale.support.SalePaymentResolver.PaymentAmounts;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.Set;

import static com.pos.service.sale.payment.PaymentAmountScale.scale;

/**
 * Безналичная оплата на полную сумму. Покрывает CARD и MPESA с одинаковой логикой.
 * Для отдельного процессора достаточно добавить новый {@link SalePaymentStrategy}.
 */
@Component
class CardPaymentStrategy implements SalePaymentStrategy {

    @Override
    public Set<Sale.PaymentMethod> supports() {
        return EnumSet.of(Sale.PaymentMethod.CARD, Sale.PaymentMethod.MPESA);
    }

    @Override
    public PaymentAmounts resolve(BigDecimal total, CreateSaleRequest request) {
        BigDecimal card = scale(total);
        return new PaymentAmounts(BigDecimal.ZERO, card, card, BigDecimal.ZERO);
    }
}
