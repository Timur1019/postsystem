package com.pos.service.finance.support;

import com.pos.entity.Customer;
import com.pos.entity.Sale;
import com.pos.util.LogUtil;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;

public final class FinanceAdvancePaymentPayloadBuilder {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private FinanceAdvancePaymentPayloadBuilder() {
    }

    public static Map<String, Object> build(Sale sale) {
        if (sale.getReceiptType() != Sale.ReceiptType.SALE) {
            return null;
        }
        if (sale.getAdvanceAmount() == null || sale.getAdvanceAmount().signum() <= 0) {
            return null;
        }
        Customer customer = sale.getCustomer();
        if (customer == null) {
            LogUtil.warn(FinanceAdvancePaymentPayloadBuilder.class, "Advance payment sync skipped: no customer sale={}", sale.getId());
            return null;
        }
        if (sale.getStore() == null || sale.getStore().getCompany() == null) {
            LogUtil.warn(FinanceAdvancePaymentPayloadBuilder.class, "Advance payment sync skipped: missing store/company sale={}", sale.getId());
            return null;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", sale.getStore().getCompany().getId());
        payload.put("storeId", sale.getStore().getId());
        payload.put("saleId", sale.getId());
        payload.put("receiptNumber", sale.getReceiptNumber());
        payload.put("customerId", customer.getId());
        payload.put("customerName", customer.getName());
        payload.put("amount", sale.getAdvanceAmount());
        payload.put("transactionDate", LocalDate.ofInstant(sale.getCreatedAt(), ZONE));
        if (sale.getCashier() != null) {
            payload.put("createdBy", sale.getCashier().getId());
        }
        return payload;
    }
}
