package com.pos.service.salesledger.impl;

import com.pos.cache.salesledger.SalesLedgerCache;
import com.pos.cache.salesledger.SalesLedgerEntry;
import com.pos.cache.salesledger.SalesLedgerSnapshot;
import com.pos.config.PosCacheProperties;
import com.pos.dto.sale.SaleResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.Sale;
import com.pos.mapper.SaleMapper;
import com.pos.service.cache.PosCacheRefreshTask;
import com.pos.service.cache.support.AbstractPosCacheRefreshService;
import com.pos.service.salesledger.SalesLedgerCacheLoader;
import com.pos.service.salesledger.SalesLedgerCacheService;
import com.pos.service.salesledger.support.SalesLedgerCacheSearchSupport;
import com.pos.util.LogUtil;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
@Order(2)
public class SalesLedgerCacheServiceImpl
    extends AbstractPosCacheRefreshService<SalesLedgerSnapshot>
    implements SalesLedgerCacheService, PosCacheRefreshTask {

    private final SalesLedgerCacheLoader loader;
    private final SalesLedgerCache cache;
    private final SaleMapper saleMapper;
    private final SalesLedgerCacheSearchSupport searchSupport;
    private final PosCacheProperties properties;

    public SalesLedgerCacheServiceImpl(
        SalesLedgerCacheLoader loader,
        SalesLedgerCache cache,
        SaleMapper saleMapper,
        SalesLedgerCacheSearchSupport searchSupport,
        PosCacheProperties properties
    ) {
        this.loader = loader;
        this.cache = cache;
        this.saleMapper = saleMapper;
        this.searchSupport = searchSupport;
        this.properties = properties;
    }

    @Override
    public String cacheName() {
        return "sales-ledger";
    }

    @Override
    protected boolean isRefreshEnabled() {
        return properties.getSalesLedger().isEnabled();
    }

    @Override
    protected SalesLedgerSnapshot loadSnapshot() {
        return loader.loadSnapshot();
    }

    @Override
    protected void replaceSnapshot(SalesLedgerSnapshot snapshot) {
        cache.replace(snapshot);
    }

    @Override
    protected Class<?> logSource() {
        return SalesLedgerCacheServiceImpl.class;
    }

    @Override
    protected void logRefreshSuccess(SalesLedgerSnapshot snapshot, long elapsedMs) {
        LogUtil.info(
            logSource(),
            "Sales ledger cache refreshed in {} ms ({} .. {}, {} sales)",
            elapsedMs,
            snapshot.windowStart(),
            snapshot.windowEnd(),
            snapshot.entries().size()
        );
    }

    @Override
    protected String refreshFailedMessage() {
        return "Sales ledger cache refresh failed";
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
        return cache.current().flatMap(snapshot ->
            searchSupport.search(
                snapshot, from, to, cashierId, search, receiptNumber, saleId,
                cashierName, paymentMethod, status, paymentSettlement, storeId, pageable
            )
        );
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
}
