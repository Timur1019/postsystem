package com.pos.service.salesledger;

import com.pos.cache.salesledger.SalesLedgerEntry;
import com.pos.cache.salesledger.SalesLedgerSnapshot;
import com.pos.dto.sale.SaleResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.Sale;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public final class SalesLedgerReadSupport {

    private SalesLedgerReadSupport() {
    }

    public static PageResponse<SaleResponse> search(
        SalesLedgerSnapshot snapshot,
        SalesLedgerQuery query,
        Pageable pageable
    ) {
        List<SaleResponse> filtered = snapshot.entries().stream()
            .filter(e -> matches(e, query))
            .map(SalesLedgerEntry::sale)
            .toList();

        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        int total = filtered.size();
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        int from = Math.min(page * size, total);
        int to = Math.min(from + size, total);

        return new PageResponse<>(
            filtered.subList(from, to),
            totalPages,
            total,
            size,
            page
        );
    }

    private static boolean matches(SalesLedgerEntry entry, SalesLedgerQuery q) {
        SaleResponse s = entry.sale();
        Instant created = s.createdAt();

        if (created.isBefore(q.start()) || !created.isBefore(q.end())) {
            return false;
        }
        if (q.cashierId() != null && !q.cashierId().equals(entry.cashierId())) {
            return false;
        }
        if (q.saleId() != null && !q.saleId().equals(s.id())) {
            return false;
        }
        if (q.receipt() != null && !containsIgnoreCase(s.receiptNumber(), q.receipt())) {
            return false;
        }
        if (q.cashierName() != null && !containsIgnoreCase(s.cashierName(), q.cashierName())) {
            return false;
        }
        if (q.q() != null) {
            boolean hit = containsIgnoreCase(s.receiptNumber(), q.q())
                || containsIgnoreCase(s.cashierName(), q.q());
            if (!hit) {
                return false;
            }
        }
        if (q.paymentMethod() != null && !q.paymentMethod().equalsIgnoreCase(s.paymentMethod())) {
            return false;
        }
        if (q.status() != null && !q.status().equalsIgnoreCase(s.status())) {
            return false;
        }
        if (q.paymentSettlement() != null && !matchesSettlement(s, q.paymentSettlement())) {
            return false;
        }
        if (q.storeId() != null && (s.storeId() == null || !q.storeId().equals(s.storeId()))) {
            return false;
        }
        return true;
    }

    private static boolean matchesSettlement(SaleResponse s, String settlement) {
        String receiptType = s.receiptType();
        String normalized = receiptType == null || receiptType.isBlank()
            ? "SALE"
            : receiptType.trim().toUpperCase(Locale.ROOT);
        return switch (settlement.toUpperCase(Locale.ROOT)) {
            case "FULL" -> "SALE".equals(normalized);
            case "ADVANCE" -> "ADVANCE".equals(normalized);
            case "CREDIT" -> "CREDIT".equals(normalized);
            default -> true;
        };
    }

    private static boolean containsIgnoreCase(String value, String needle) {
        if (value == null || needle == null) {
            return false;
        }
        return value.toLowerCase(Locale.ROOT).contains(needle.toLowerCase(Locale.ROOT));
    }

    public record SalesLedgerQuery(
        Instant start,
        Instant end,
        UUID cashierId,
        String receipt,
        String cashierName,
        String q,
        String paymentMethod,
        String status,
        UUID saleId,
        String paymentSettlement,
        Integer storeId
    ) {
    }
}
