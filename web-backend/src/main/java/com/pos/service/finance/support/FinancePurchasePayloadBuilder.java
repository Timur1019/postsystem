package com.pos.service.finance.support;

import com.pos.entity.StockReceipt;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;

public final class FinancePurchasePayloadBuilder {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private FinancePurchasePayloadBuilder() {
    }

    public static Map<String, Object> build(StockReceipt receipt, String paymentType) {
        if (receipt.getStore() == null || receipt.getStore().getCompany() == null) {
            return null;
        }
        if (receipt.getTotalCost() == null || receipt.getTotalCost().signum() <= 0) {
            return null;
        }
        String normalizedPayment = paymentType != null ? paymentType.toUpperCase() : "CASH";
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("paymentType", normalizedPayment);
        payload.put("companyId", receipt.getStore().getCompany().getId());
        payload.put("storeId", receipt.getStore().getId());
        payload.put("receiptId", receipt.getId());
        payload.put("receiptNumber", receipt.getReceiptNumber());
        payload.put("totalAmount", receipt.getTotalCost());
        if (receipt.getSupplier() != null) {
            payload.put("supplierId", receipt.getSupplier().getId());
            payload.put("supplierName", receipt.getSupplier().getName());
        }
        payload.put("transactionDate", LocalDate.ofInstant(receipt.getCreatedAt(), ZONE));
        if (receipt.getCreatedBy() != null) {
            payload.put("createdBy", receipt.getCreatedBy().getId());
        }
        return payload;
    }
}
