package com.pos.service.sale.payment;

import com.pos.dto.sale.CreateSaleRequest;
import com.pos.entity.Sale;
import com.pos.exception.BadRequestException;
import com.pos.service.sale.support.SalePaymentResolver.PaymentAmounts;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.Set;

import static com.pos.service.sale.payment.PaymentAmountScale.scale;

@Component
class CashPaymentStrategy implements SalePaymentStrategy {

    @Override
    public Set<Sale.PaymentMethod> supports() {
        return EnumSet.of(Sale.PaymentMethod.CASH);
    }

    @Override
    public PaymentAmounts resolve(BigDecimal total, CreateSaleRequest request) {
        BigDecimal cash = scale(total);
        BigDecimal tendered = scale(request.amountTendered() != null ? request.amountTendered() : total);
        if (tendered.compareTo(cash) < 0) {
            throw new BadRequestException("Получено наличными меньше суммы оплаты");
        }
        return new PaymentAmounts(
            cash,
            BigDecimal.ZERO,
            tendered,
            tendered.subtract(cash).max(BigDecimal.ZERO)
        );
    }
}
