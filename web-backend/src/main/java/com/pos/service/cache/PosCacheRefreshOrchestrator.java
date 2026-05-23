package com.pos.service.cache;

import com.pos.config.PosCacheProperties;
import com.pos.service.cache.support.PosCacheParallelRefresher;
import com.pos.util.LogUtil;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Единая точка прогрева всех {@link PosCacheRefreshTask} (аналитика, журнал продаж, …).
 */
@Service
public class PosCacheRefreshOrchestrator {

    private final List<PosCacheRefreshTask> refreshTasks;
    private final PosCacheProperties properties;
    private final PosCacheParallelRefresher parallelRefresher;

    public PosCacheRefreshOrchestrator(
        List<PosCacheRefreshTask> refreshTasks,
        PosCacheProperties properties,
        PosCacheParallelRefresher parallelRefresher
    ) {
        this.refreshTasks = refreshTasks;
        this.properties = properties;
        this.parallelRefresher = parallelRefresher;
    }

    public void refreshAll() {
        LogUtil.info(
            PosCacheRefreshOrchestrator.class,
            "POS cache refresh started (tasks={}, parallel={})",
            refreshTasks.stream().map(PosCacheRefreshTask::cacheName).toList(),
            properties.isParallelRefresh()
        );
        parallelRefresher.refreshAll(refreshTasks, properties.isParallelRefresh());
        LogUtil.info(PosCacheRefreshOrchestrator.class, "POS cache refresh finished");
    }

    public boolean allReady() {
        return !refreshTasks.isEmpty() && refreshTasks.stream().allMatch(PosCacheRefreshTask::isReady);
    }
}
