package com.pos.service.salesledger.impl;

import com.pos.cache.salesledger.SalesLedgerEntry;
import com.pos.cache.salesledger.SalesLedgerSnapshot;
import com.pos.config.PosCacheProperties;
import com.pos.service.cache.support.PosCacheWindowSupport;
import com.pos.service.salesledger.SalesLedgerCacheLoader;
import com.pos.service.salesledger.support.SalesLedgerChunkLoader;
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
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
@Transactional(readOnly = true)
public class SalesLedgerCacheLoaderImpl implements SalesLedgerCacheLoader {

    private final SalesLedgerChunkLoader chunkLoader;
    private final PosCacheProperties properties;
    private final Executor reportCacheExecutor;

    public SalesLedgerCacheLoaderImpl(
        SalesLedgerChunkLoader chunkLoader,
        PosCacheProperties properties,
        @Qualifier("reportCacheExecutor") Executor reportCacheExecutor
    ) {
        this.chunkLoader = chunkLoader;
        this.properties = properties;
        this.reportCacheExecutor = reportCacheExecutor;
    }

    @Override
    public SalesLedgerSnapshot loadSnapshot() {
        ZoneId zone = ZoneId.of(properties.getZoneId());
        LocalDate windowStart = PosCacheWindowSupport.windowStart(properties, zone);
        LocalDate windowEnd = PosCacheWindowSupport.windowEnd(zone);
        int chunks = Math.max(1, properties.getSalesLedger().getLoadChunks());

        LogUtil.info(
            SalesLedgerCacheLoaderImpl.class,
            "Loading sales ledger cache: {} .. {} ({} parallel chunks, zone {})",
            windowStart,
            windowEnd,
            chunks,
            zone
        );

        List<CompletableFuture<List<SalesLedgerEntry>>> futures =
            scheduleChunks(windowStart, windowEnd, zone, chunks);

        CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();

        var entries = mergeEntries(futures);
        return new SalesLedgerSnapshot(windowStart, windowEnd, zone, Instant.now(), entries);
    }

    private List<CompletableFuture<List<SalesLedgerEntry>>> scheduleChunks(
        LocalDate windowStart,
        LocalDate windowEnd,
        ZoneId zone,
        int chunks
    ) {
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
            cursor = chunkEnd.plusDays(1);

            futures.add(CompletableFuture.supplyAsync(
                () -> chunkLoader.loadBetween(start, end),
                reportCacheExecutor
            ));
        }
        return futures;
    }

    private static List<SalesLedgerEntry> mergeEntries(List<CompletableFuture<List<SalesLedgerEntry>>> futures) {
        var byId = new HashMap<UUID, SalesLedgerEntry>();
        for (CompletableFuture<List<SalesLedgerEntry>> future : futures) {
            for (SalesLedgerEntry entry : future.join()) {
                byId.put(entry.sale().id(), entry);
            }
        }
        return byId.values().stream()
            .sorted(Comparator.comparing((SalesLedgerEntry e) -> e.sale().createdAt()).reversed())
            .toList();
    }
}
