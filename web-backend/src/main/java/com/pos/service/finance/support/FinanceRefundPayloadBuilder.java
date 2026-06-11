package com.pos.service.finance.support;

import com.pos.entity.Sale;
import com.pos.util.LogUtil;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public final class FinanceRefundPayloadBuilder {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private FinanceRefundPayloadBuilder() {
    }

    public static Map<String, Object> build(Sale sale, UUID returnEventId, BigDecimal refundAmount) {
        if (returnEventId == null || refundAmount == null || refundAmount.signum() <= 0) {
            return null;
        }
        if (sale.getReceiptType() == Sale.ReceiptType.CREDIT || sale.getReceiptType() == Sale.ReceiptType.ADVANCE) {
            return null;
        }
        if (sale.getStore() == null || sale.getStore().getCompany() == null) {
            LogUtil.warn(FinanceRefundPayloadBuilder.class, "Finance refund sync skipped: missing store/company sale={}", sale.getId());
            return null;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", sale.getStore().getCompany().getId());
        payload.put("storeId", sale.getStore().getId());
        payload.put("returnEventId", returnEventId);
        payload.put("saleId", sale.getId());
        payload.put("receiptNumber", sale.getReceiptNumber());
        payload.put("refundAmount", refundAmount);
        applyPaymentSplit(payload, sale, refundAmount);
        payload.put("paymentMethod", sale.getPaymentMethod().name());
        payload.put("transactionDate", LocalDate.now(ZONE));
        if (sale.getCashier() != null) {
            payload.put("createdBy", sale.getCashier().getId());
        }
        return payload;
    }

    private static void applyPaymentSplit(Map<String, Object> payload, Sale sale, BigDecimal refundAmount) {
        BigDecimal cash = sale.getCashAmount() != null ? sale.getCashAmount() : BigDecimal.ZERO;
        BigDecimal card = sale.getCardAmount() != null ? sale.getCardAmount() : BigDecimal.ZERO;
        BigDecimal total = sale.getTotalAmount() != null ? sale.getTotalAmount() : BigDecimal.ZERO;
        if (total.signum() == 0 || card.signum() == 0) {
            payload.put("cashAmount", refundAmount);
            payload.put("cardAmount", BigDecimal.ZERO);
            return;
        }
        if (cash.signum() == 0) {
            payload.put("cashAmount", BigDecimal.ZERO);
            payload.put("cardAmount", refundAmount);
            return;
        }
        BigDecimal cashRefund = refundAmount.multiply(cash).divide(total, 2, RoundingMode.HALF_UP);
        BigDecimal cardRefund = refundAmount.subtract(cashRefund);
        payload.put("cashAmount", cashRefund);
        payload.put("cardAmount", cardRefund);
    }
}
