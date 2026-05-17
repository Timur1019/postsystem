package com.pos.service.support;

import com.pos.entity.Sale;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

public final class SalesQuerySupport {

    private SalesQuerySupport() {
    }

    public record SalesFilter(
        Instant start,
        Instant end,
        UUID cashierId,
        String receipt,
        String cashierName,
        String q,
        Sale.PaymentMethod paymentMethod,
        Sale.SaleStatus status,
        UUID saleId,
        String paymentSettlement,
        Integer storeId
    ) {
    }

    public static Optional<SalesFilter> buildFilters(
        LocalDate from,
        LocalDate to,
        String cashierId,
        String search,
        String receiptNumber,
        String saleIdStr,
        String cashierName,
        String paymentMethodStr,
        String statusStr,
        String paymentSettlement,
        String storeIdStr
    ) {
        ZoneId z = ZoneId.systemDefault();
        Instant start = from != null ? from.atStartOfDay(z).toInstant() : Instant.EPOCH;
        Instant end = to != null ? to.plusDays(1).atStartOfDay(z).toInstant()
            : Instant.now().plus(3650, ChronoUnit.DAYS);
        UUID cid = null;
        if (cashierId != null && !cashierId.isBlank()) {
            try {
                cid = UUID.fromString(cashierId);
            } catch (IllegalArgumentException ignored) {
                // invalid filter ignored
            }
        }
        UUID saleId = null;
        if (saleIdStr != null && !saleIdStr.isBlank()) {
            try {
                saleId = UUID.fromString(saleIdStr.trim());
            } catch (IllegalArgumentException e) {
                return Optional.empty();
            }
        }
        Sale.PaymentMethod pm = parsePaymentMethod(paymentMethodStr);
        Sale.SaleStatus st = parseSaleStatus(statusStr);
        String q = blankToNull(search);
        String receipt = blankToNull(receiptNumber);
        String cname = blankToNull(cashierName);
        String ps = paymentSettlement != null && !paymentSettlement.isBlank() && !"ALL".equalsIgnoreCase(paymentSettlement)
            ? paymentSettlement.trim()
            : null;
        Integer storeId = null;
        if (storeIdStr != null && !storeIdStr.isBlank()) {
            try {
                storeId = Integer.parseInt(storeIdStr.trim());
            } catch (NumberFormatException ignored) {
                return Optional.empty();
            }
        }
        return Optional.of(new SalesFilter(start, end, cid, receipt, cname, q, pm, st, saleId, ps, storeId));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static Sale.PaymentMethod parsePaymentMethod(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return Sale.PaymentMethod.valueOf(s.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static Sale.SaleStatus parseSaleStatus(String s) {
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
