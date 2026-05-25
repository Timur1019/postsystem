package com.pos.service.sale.payment;

import com.pos.dto.sale.CreateSaleRequest;
import com.pos.entity.Sale;
import com.pos.service.sale.support.SalePaymentResolver.PaymentAmounts;

import java.math.BigDecimal;
import java.util.Set;

/**
 * Стратегия расчёта сумм по конкретному способу оплаты.
 * Новый способ оплаты — это новая реализация, без правок существующих.
 */
public interface SalePaymentStrategy {

    Set<Sale.PaymentMethod> supports();

    PaymentAmounts resolve(BigDecimal total, CreateSaleRequest request);
}
