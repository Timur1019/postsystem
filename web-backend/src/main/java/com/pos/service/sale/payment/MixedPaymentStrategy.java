package com.pos.service.sale.payment;

import com.pos.dto.sale.CreateSaleRequest;
import com.pos.entity.Sale;
import com.pos.exception.PosExceptions;
import com.pos.service.sale.support.SalePaymentResolver.PaymentAmounts;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.Set;

import static com.pos.service.sale.payment.PaymentAmountScale.scale;

@Component
class MixedPaymentStrategy implements SalePaymentStrategy {

    @Override
    public Set<Sale.PaymentMethod> supports() {
        return EnumSet.of(Sale.PaymentMethod.MIXED);
    }

    @Override
    public PaymentAmounts resolve(BigDecimal total, CreateSaleRequest request) {
        if (request.cashAmount() == null) {
            throw PosExceptions.badRequest("Укажите сумму наличными для смешанной оплаты");
        }
        BigDecimal cash = scale(request.cashAmount());
        if (cash.signum() < 0) {
            throw PosExceptions.badRequest("Суммы оплаты не могут быть отрицательными");
        }
        if (cash.compareTo(total) > 0) {
            cash = total;
        }
        BigDecimal card = scale(total.subtract(cash));
        if (cash.signum() == 0 && card.signum() == 0) {
            throw PosExceptions.badRequest("Укажите хотя бы одну сумму оплаты");
        }
        BigDecimal tendered = cash.signum() > 0
            ? scale(request.amountTendered() != null ? request.amountTendered() : cash)
            : BigDecimal.ZERO;
        if (cash.signum() > 0 && tendered.compareTo(cash) < 0) {
            throw PosExceptions.badRequest("Получено наличными меньше наличной части");
        }
        BigDecimal change = cash.signum() > 0
            ? tendered.subtract(cash).max(BigDecimal.ZERO)
            : BigDecimal.ZERO;
        return new PaymentAmounts(cash, card, tendered, change);
    }
}
