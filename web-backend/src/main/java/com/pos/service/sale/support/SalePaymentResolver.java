package com.pos.service.sale.support;

import com.pos.dto.sale.CreateSaleRequest;
import com.pos.entity.Sale;
import com.pos.exception.BadRequestException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class SalePaymentResolver {

    public record PaymentAmounts(
        BigDecimal cash,
        BigDecimal card,
        BigDecimal tendered,
        BigDecimal change
    ) {}

    public PaymentAmounts resolve(Sale.PaymentMethod paymentMethod, BigDecimal total, CreateSaleRequest req) {
        return switch (paymentMethod) {
            case CASH -> {
                BigDecimal cash = scale(total);
                BigDecimal tendered = scale(req.amountTendered() != null ? req.amountTendered() : total);
                if (tendered.compareTo(cash) < 0) {
                    throw new BadRequestException("Получено наличными меньше суммы оплаты");
                }
                yield new PaymentAmounts(cash, BigDecimal.ZERO, tendered, tendered.subtract(cash).max(BigDecimal.ZERO));
            }
            case CARD, MPESA -> {
                BigDecimal card = scale(total);
                yield new PaymentAmounts(BigDecimal.ZERO, card, card, BigDecimal.ZERO);
            }
            case MIXED -> resolveMixed(total, req);
        };
    }

    private PaymentAmounts resolveMixed(BigDecimal total, CreateSaleRequest req) {
        if (req.cashAmount() == null) {
            throw new BadRequestException("Укажите сумму наличными для смешанной оплаты");
        }
        BigDecimal cash = scale(req.cashAmount());
        if (cash.signum() < 0) {
            throw new BadRequestException("Суммы оплаты не могут быть отрицательными");
        }
        if (cash.compareTo(total) > 0) {
            cash = total;
        }
        BigDecimal card = scale(total.subtract(cash));
        if (cash.signum() == 0 && card.signum() == 0) {
            throw new BadRequestException("Укажите хотя бы одну сумму оплаты");
        }
        BigDecimal tendered = cash.signum() > 0
            ? scale(req.amountTendered() != null ? req.amountTendered() : cash)
            : BigDecimal.ZERO;
        if (cash.signum() > 0 && tendered.compareTo(cash) < 0) {
            throw new BadRequestException("Получено наличными меньше наличной части");
        }
        BigDecimal change = cash.signum() > 0 ? tendered.subtract(cash).max(BigDecimal.ZERO) : BigDecimal.ZERO;
        return new PaymentAmounts(cash, card, tendered, change);
    }

    private static BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
