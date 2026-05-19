package com.pos.service.sale.support;

import com.pos.entity.Sale;

public final class SaleEnumParser {

    private SaleEnumParser() {
    }

    public static Sale.ReceiptType receiptType(String raw) {
        if (raw == null || raw.isBlank()) {
            return Sale.ReceiptType.SALE;
        }
        return Sale.ReceiptType.valueOf(raw.trim().toUpperCase());
    }

    public static Sale.CardType cardType(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return Sale.CardType.valueOf(raw.trim().toUpperCase());
    }

    public static Sale.PaymentMethod paymentMethod(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return Sale.PaymentMethod.valueOf(s.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public static Sale.SaleStatus saleStatus(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return Sale.SaleStatus.valueOf(s.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
