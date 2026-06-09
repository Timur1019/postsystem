package com.pos.service.sale.support;

import com.pos.dto.sale.CreateSaleRequest;
import com.pos.entity.Sale;
import com.pos.exception.PosExceptions;
import com.pos.service.sale.payment.SalePaymentStrategy;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Координатор расчёта сумм оплаты: подбирает {@link SalePaymentStrategy} под {@link Sale.PaymentMethod}.
 * Сам класс закрыт для изменений — расширяется новой реализацией стратегии.
 */
@Component
public class SalePaymentResolver {

    private final Map<Sale.PaymentMethod, SalePaymentStrategy> strategies;

    public SalePaymentResolver(List<SalePaymentStrategy> strategies) {
        Map<Sale.PaymentMethod, SalePaymentStrategy> map = new EnumMap<>(Sale.PaymentMethod.class);
        for (SalePaymentStrategy strategy : strategies) {
            for (Sale.PaymentMethod method : strategy.supports()) {
                SalePaymentStrategy previous = map.put(method, strategy);
                if (previous != null) {
                    throw new IllegalStateException(
                        "Дублирующая стратегия оплаты для " + method
                            + ": " + previous.getClass().getName()
                            + " и " + strategy.getClass().getName()
                    );
                }
            }
        }
        this.strategies = Map.copyOf(map);
    }

    public PaymentAmounts resolve(Sale.PaymentMethod paymentMethod, BigDecimal total, CreateSaleRequest req) {
        SalePaymentStrategy strategy = strategies.get(paymentMethod);
        if (strategy == null) {
            throw PosExceptions.badRequest("Способ оплаты не поддерживается: " + paymentMethod);
        }
        return strategy.resolve(total, req);
    }

    public record PaymentAmounts(
        BigDecimal cash,
        BigDecimal card,
        BigDecimal tendered,
        BigDecimal change
    ) {
    }
}
