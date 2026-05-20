package com.pos.service.cache;

import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PosCacheRefreshScheduler {

    private final PosCacheWarmupCoordinator cacheWarmupCoordinator;

    @EventListener(ApplicationReadyEvent.class)
    public void warmOnStartup() {
        LogUtil.info(PosCacheRefreshScheduler.class, "Warming POS caches on startup (analytics + sales ledger)");
        cacheWarmupCoordinator.refreshAllCaches();
    }

    @Scheduled(cron = "${app.cache.refresh-cron:0 0 1 * * *}", zone = "${app.cache.zone-id:Asia/Tashkent}")
    public void nightlyRefresh() {
        LogUtil.info(PosCacheRefreshScheduler.class, "Nightly POS cache refresh started");
        cacheWarmupCoordinator.refreshAllCaches();
    }
}
