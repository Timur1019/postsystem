package com.pos.service.finance.support;

import com.pos.entity.Customer;
import com.pos.entity.Sale;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;

public final class FinanceCreditSalePayloadBuilder {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private FinanceCreditSalePayloadBuilder() {
    }

    public static Map<String, Object> build(Sale sale) {
        if (sale.getReceiptType() != Sale.ReceiptType.CREDIT) {
            return null;
        }
        if (sale.getCustomer() == null) {
            return null;
        }
        if (sale.getStore() == null || sale.getStore().getCompany() == null) {
            return null;
        }
        Customer customer = sale.getCustomer();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", sale.getStore().getCompany().getId());
        payload.put("storeId", sale.getStore().getId());
        payload.put("customerId", customer.getId());
        payload.put("customerName", customer.getName());
        payload.put("saleId", sale.getId());
        payload.put("receiptNumber", sale.getReceiptNumber());
        payload.put("totalAmount", sale.getTotalAmount());
        payload.put("transactionDate", LocalDate.ofInstant(sale.getCreatedAt(), ZONE));
        if (sale.getCashier() != null) {
            payload.put("createdBy", sale.getCashier().getId());
        }
        return payload;
    }
}
