package com.pos.service.salesledger.impl;

import com.pos.cache.salesledger.SalesLedgerCache;
import com.pos.cache.salesledger.SalesLedgerEntry;
import com.pos.cache.salesledger.SalesLedgerSnapshot;
import com.pos.config.PosCacheProperties;
import com.pos.dto.sale.SaleResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.Sale;
import com.pos.mapper.SaleMapper;
import com.pos.service.salesledger.SalesLedgerCacheLoader;
import com.pos.service.salesledger.SalesLedgerCacheService;
import com.pos.service.salesledger.SalesLedgerReadSupport;
import com.pos.util.LogUtil;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

@Service
public class SalesLedgerCacheServiceImpl implements SalesLedgerCacheService {

    private final SalesLedgerCacheLoader loader;
    private final SalesLedgerCache cache;
    private final SaleMapper saleMapper;
    private final PosCacheProperties properties;

    public SalesLedgerCacheServiceImpl(
        SalesLedgerCacheLoader loader,
        SalesLedgerCache cache,
        SaleMapper saleMapper,
        PosCacheProperties properties
    ) {
        this.loader = loader;
        this.cache = cache;
        this.saleMapper = saleMapper;
        this.properties = properties;
    }

    @Override
    public synchronized void refresh() {
        if (!properties.getSalesLedger().isEnabled()) {
            return;
        }
        long started = System.currentTimeMillis();
        try {
            SalesLedgerSnapshot snapshot = loader.loadSnapshot();
            cache.replace(snapshot);
            LogUtil.info(
                SalesLedgerCacheServiceImpl.class,
                "Sales ledger cache refreshed in {} ms ({} .. {}, {} sales)",
                System.currentTimeMillis() - started,
                snapshot.windowStart(),
                snapshot.windowEnd(),
                snapshot.entries().size()
            );
        } catch (Exception e) {
            LogUtil.error(SalesLedgerCacheServiceImpl.class, "Sales ledger cache refresh failed", e);
            throw e;
        }
    }

    @Override
    public boolean isReady() {
        return properties.getSalesLedger().isEnabled() && cache.current().isPresent();
    }

    @Override
    public Optional<PageResponse<SaleResponse>> trySearch(
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
        if (!properties.getSalesLedger().isEnabled()) {
            return Optional.empty();
        }
        Optional<SalesLedgerSnapshot> snapshotOpt = cache.current();
        if (snapshotOpt.isEmpty()) {
            return Optional.empty();
        }
        SalesLedgerSnapshot snapshot = snapshotOpt.get();
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

    @Override
    public void onSaleChanged(Sale sale) {
        if (!properties.getSalesLedger().isEnabled() || sale == null) {
            return;
        }
        cache.current().ifPresent(snapshot -> {
            if (snapshot.coversInstant(sale.getCreatedAt())) {
                cache.upsert(new SalesLedgerEntry(
                    sale.getCashier().getId(),
                    saleMapper.toSummaryResponse(sale)
                ));
            }
        });
    }

    @Override
    public void onSaleRemoved(UUID saleId) {
        if (!properties.getSalesLedger().isEnabled() || saleId == null) {
            return;
        }
        cache.remove(saleId);
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
