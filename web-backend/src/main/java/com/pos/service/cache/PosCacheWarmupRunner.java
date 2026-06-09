package com.pos.service.cache;

import com.pos.util.LogUtil;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class PosCacheWarmupRunner {

    private final PosCacheRefreshOrchestrator cacheRefreshOrchestrator;

    public PosCacheWarmupRunner(PosCacheRefreshOrchestrator cacheRefreshOrchestrator) {
        this.cacheRefreshOrchestrator = cacheRefreshOrchestrator;
    }

    @Async("posCacheWarmupExecutor")
    public void warmInBackground() {
        LogUtil.info(PosCacheWarmupRunner.class, "Background POS cache warmup started");
        cacheRefreshOrchestrator.refreshAll();
        LogUtil.info(PosCacheWarmupRunner.class, "Background POS cache warmup finished");
    }
}
