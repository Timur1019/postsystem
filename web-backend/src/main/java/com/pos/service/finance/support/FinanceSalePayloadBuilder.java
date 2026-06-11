package com.pos.service.finance.support;

import com.pos.entity.Sale;
import com.pos.util.LogUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;

public final class FinanceSalePayloadBuilder {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private FinanceSalePayloadBuilder() {
    }

    public static Map<String, Object> build(Sale sale) {
        if (sale.getReceiptType() == Sale.ReceiptType.CREDIT) {
            return null;
        }
        if (sale.getReceiptType() == Sale.ReceiptType.ADVANCE) {
            boolean hasPayment = (sale.getCashAmount() != null && sale.getCashAmount().signum() > 0)
                || (sale.getCardAmount() != null && sale.getCardAmount().signum() > 0);
            if (!hasPayment) {
                return null;
            }
        }
        if (sale.getStatus() != Sale.SaleStatus.COMPLETED) {
            return null;
        }
        if (sale.getStore() == null || sale.getStore().getCompany() == null) {
            LogUtil.warn(FinanceSalePayloadBuilder.class, "Finance sale sync skipped: missing store/company sale={}", sale.getId());
            return null;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", sale.getStore().getCompany().getId());
        payload.put("storeId", sale.getStore().getId());
        payload.put("saleId", sale.getId());
        payload.put("receiptNumber", sale.getReceiptNumber());
        payload.put("totalAmount", sale.getTotalAmount());
        payload.put("cashAmount", sale.getCashAmount() != null ? sale.getCashAmount() : BigDecimal.ZERO);
        payload.put("cardAmount", sale.getCardAmount() != null ? sale.getCardAmount() : BigDecimal.ZERO);
        payload.put("paymentMethod", sale.getPaymentMethod().name());
        payload.put("transactionDate", LocalDate.ofInstant(sale.getCreatedAt(), ZONE));
        if (sale.getCashier() != null) {
            payload.put("createdBy", sale.getCashier().getId());
        }
        return payload;
    }
}
