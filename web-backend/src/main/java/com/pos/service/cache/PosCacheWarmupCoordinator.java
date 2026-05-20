package com.pos.service.cache;

import com.pos.config.PosCacheProperties;
import com.pos.service.analytics.ReportAnalyticsCacheService;
import com.pos.service.salesledger.SalesLedgerCacheService;
import com.pos.util.LogUtil;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.Executor;

/**
 * Единая точка прогрева кешей отчётов.
 * <ul>
 *   <li>Данные лежат в памяти JVM ({@link java.util.concurrent.atomic.AtomicReference}); у каждого экземпляра backend свой снимок.
 *     «Работает только тут» = на этом узле есть прогретый процесс.</li>
 *   <li>Ночное обновление и прогрев при старте идут через {@link PosCacheRefreshScheduler}, если включён Spring
 *     ({@link org.springframework.scheduling.annotation.EnableScheduling} в {@link com.pos.config.SchedulingConfig}).</li>
 *   <li>При {@code app.cache.parallel-refresh=true} аналитика и журнал продаж загружаются параллельно (разные блокировки
 *     {@code synchronized refresh()} на каждом сервисе).</li>
 * </ul>
 */
@Service
public class PosCacheWarmupCoordinator {

    private final ReportAnalyticsCacheService analyticsCacheService;
    private final SalesLedgerCacheService salesLedgerCacheService;
    private final PosCacheProperties properties;
    private final Executor posCacheWarmupExecutor;

    public PosCacheWarmupCoordinator(
        ReportAnalyticsCacheService analyticsCacheService,
        SalesLedgerCacheService salesLedgerCacheService,
        PosCacheProperties properties,
        @Qualifier("posCacheWarmupExecutor") Executor posCacheWarmupExecutor
    ) {
        this.analyticsCacheService = analyticsCacheService;
        this.salesLedgerCacheService = salesLedgerCacheService;
        this.properties = properties;
        this.posCacheWarmupExecutor = posCacheWarmupExecutor;
    }

    public void refreshAllCaches() {
        if (!properties.isParallelRefresh()) {
            analyticsCacheService.refresh();
            salesLedgerCacheService.refresh();
            return;
        }
        CompletableFuture<Void> analytics = CompletableFuture.runAsync(
            () -> analyticsCacheService.refresh(),
            posCacheWarmupExecutor
        );
        CompletableFuture<Void> ledger = CompletableFuture.runAsync(
            () -> salesLedgerCacheService.refresh(),
            posCacheWarmupExecutor
        );
        try {
            CompletableFuture.allOf(analytics, ledger).join();
        } catch (CompletionException e) {
            Throwable cause = e.getCause() != null ? e.getCause() : e;
            LogUtil.error(PosCacheWarmupCoordinator.class, "Parallel cache warmup failed", cause);
            if (cause instanceof RuntimeException re) {
                throw re;
            }
            throw e;
        }
    }
}
