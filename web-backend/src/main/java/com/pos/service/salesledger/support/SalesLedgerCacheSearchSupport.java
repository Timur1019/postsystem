package com.pos.service.salesledger.support;

import com.pos.cache.salesledger.SalesLedgerSnapshot;
import com.pos.dto.sale.SaleResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.service.salesledger.SalesLedgerReadSupport;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

@Component
public class SalesLedgerCacheSearchSupport {

    public Optional<PageResponse<SaleResponse>> search(
        SalesLedgerSnapshot snapshot,
        LocalDate from,
        LocalDate to,
        UUID cashierId,
        String search,
        String receiptNumber,
        UUID saleId,
        String cashierName,
        String paymentMethod,
        String status,
        String paymentSettlement,
        Integer storeId,
        Pageable pageable
    ) {
        ZoneId zone = snapshot.zone();

        Instant windowStart = snapshot.windowStart().atStartOfDay(zone).toInstant();
        Instant windowEnd = snapshot.windowEnd().plusDays(1).atStartOfDay(zone).toInstant();

        Instant queryStart;
        Instant queryEnd;

        if (from == null && to == null) {
            queryStart = windowStart;
            queryEnd = windowEnd;
        } else {
            queryStart = from != null ? from.atStartOfDay(zone).toInstant() : Instant.EPOCH;
            queryEnd = to != null ? to.plusDays(1).atStartOfDay(zone).toInstant()
                : Instant.now().plusSeconds(86400L * 3650);
        }

        if (queryEnd.isBefore(windowStart) || queryStart.isAfter(windowEnd)) {
            return Optional.empty();
        }
        if (queryStart.isBefore(windowStart) || queryEnd.isAfter(windowEnd)) {
            return Optional.empty();
        }

        var query = new SalesLedgerReadSupport.SalesLedgerQuery(
            queryStart,
            queryEnd,
            cashierId,
            blankToNull(receiptNumber),
            blankToNull(cashierName),
            blankToNull(search),
            blankToNull(paymentMethod),
            blankToNull(status),
            saleId,
            normalizeSettlement(paymentSettlement),
            storeId
        );

        return Optional.of(SalesLedgerReadSupport.search(snapshot, query, pageable));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String normalizeSettlement(String paymentSettlement) {
        if (paymentSettlement == null || paymentSettlement.isBlank()
            || "ALL".equalsIgnoreCase(paymentSettlement.trim())) {
            return null;
        }
        return paymentSettlement.trim();
    }
}
