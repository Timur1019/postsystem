package com.pos.service.salesledger.impl;

import com.pos.cache.salesledger.SalesLedgerEntry;
import com.pos.cache.salesledger.SalesLedgerSnapshot;
import com.pos.config.PosCacheProperties;
import com.pos.dto.sale.SaleResponse;
import com.pos.entity.Sale;
import com.pos.mapper.SaleMapper;
import com.pos.repository.SaleRepository;
import com.pos.service.analytics.ReportAnalyticsWindowSupport;
import com.pos.service.salesledger.SalesLedgerCacheLoader;
import com.pos.util.LogUtil;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
@Transactional(readOnly = true)
public class SalesLedgerCacheLoaderImpl implements SalesLedgerCacheLoader {

    private final SaleRepository saleRepository;
    private final SaleMapper saleMapper;
    private final PosCacheProperties properties;
    private final Executor reportCacheExecutor;

    public SalesLedgerCacheLoaderImpl(
        SaleRepository saleRepository,
        SaleMapper saleMapper,
        PosCacheProperties properties,
        @Qualifier("reportCacheExecutor") Executor reportCacheExecutor
    ) {
        this.saleRepository = saleRepository;
        this.saleMapper = saleMapper;
        this.properties = properties;
        this.reportCacheExecutor = reportCacheExecutor;
    }

    @Override
    public SalesLedgerSnapshot loadSnapshot() {
        ZoneId zone = ZoneId.of(properties.getZoneId());
        LocalDate windowStart = ReportAnalyticsWindowSupport.windowStart(properties, zone);
        LocalDate windowEnd = ReportAnalyticsWindowSupport.windowEnd(zone);
        int chunks = Math.max(1, properties.getSalesLedger().getLoadChunks());

        LogUtil.info(
            SalesLedgerCacheLoaderImpl.class,
            "Loading sales ledger cache: {} .. {} ({} parallel chunks, zone {})",
            windowStart,
            windowEnd,
            chunks,
            zone
        );

        long totalDays = ChronoUnit.DAYS.between(windowStart, windowEnd) + 1;
        long daysPerChunk = Math.max(1, (totalDays + chunks - 1) / chunks);

        List<CompletableFuture<List<SalesLedgerEntry>>> futures = new ArrayList<>();
        LocalDate cursor = windowStart;

        for (int i = 0; i < chunks && !cursor.isAfter(windowEnd); i++) {
            LocalDate chunkEnd = cursor.plusDays(daysPerChunk - 1);
            if (chunkEnd.isAfter(windowEnd)) {
                chunkEnd = windowEnd;
            }
            Instant start = cursor.atStartOfDay(zone).toInstant();
            Instant end = chunkEnd.plusDays(1).atStartOfDay(zone).toInstant();
            LocalDate nextCursor = chunkEnd.plusDays(1);

            futures.add(CompletableFuture.supplyAsync(
                () -> loadChunk(start, end),
                reportCacheExecutor
            ));
            cursor = nextCursor;
        }

        CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();

        Map<java.util.UUID, SalesLedgerEntry> byId = new HashMap<>();
        for (CompletableFuture<List<SalesLedgerEntry>> future : futures) {
            for (SalesLedgerEntry entry : future.join()) {
                byId.put(entry.sale().id(), entry);
            }
        }

        List<SalesLedgerEntry> entries = byId.values().stream()
            .sorted(Comparator.comparing((SalesLedgerEntry e) -> e.sale().createdAt()).reversed())
            .toList();

        return new SalesLedgerSnapshot(windowStart, windowEnd, zone, Instant.now(), entries);
    }

    private List<SalesLedgerEntry> loadChunk(Instant start, Instant end) {
        List<Sale> sales = saleRepository.findSummariesForLedgerBetween(start, end);
        return sales.stream()
            .map(s -> new SalesLedgerEntry(
                s.getCashier().getId(),
                saleMapper.toSummaryResponse(s)
            ))
            .toList();
    }
}
