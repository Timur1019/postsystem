package com.pos.service.cache.support;

import com.pos.exception.CacheRefreshException;
import com.pos.service.cache.PosCacheRefreshTask;
import com.pos.util.LogUtil;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.Executor;

@Component
public class PosCacheParallelRefresher {

    private final Executor posCacheWarmupExecutor;

    public PosCacheParallelRefresher(@Qualifier("posCacheWarmupExecutor") Executor posCacheWarmupExecutor) {
        this.posCacheWarmupExecutor = posCacheWarmupExecutor;
    }

    public void refreshAll(List<PosCacheRefreshTask> tasks, boolean parallel) {
        if (tasks == null || tasks.isEmpty()) {
            return;
        }
        if (!parallel || tasks.size() == 1) {
            tasks.forEach(PosCacheRefreshTask::refresh);
            return;
        }

        CompletableFuture<?>[] futures = tasks.stream()
            .map(task -> CompletableFuture.runAsync(task::refresh, posCacheWarmupExecutor))
            .toArray(CompletableFuture[]::new);

        try {
            CompletableFuture.allOf(futures).join();
        } catch (CompletionException e) {
            Throwable cause = e.getCause() != null ? e.getCause() : e;
            LogUtil.error(PosCacheParallelRefresher.class, "Parallel cache refresh failed", cause);
            if (cause instanceof RuntimeException re) {
                throw re;
            }
            throw new CacheRefreshException("Parallel cache refresh failed", cause);
        }
    }
}
