package com.pos.service.cache.support;

import com.pos.exception.CacheRefreshException;
import com.pos.util.LogUtil;

/**
 * Шаблон refresh для in-memory кэшей: load → replace → log.
 */
public abstract class AbstractPosCacheRefreshService<S> {

    public synchronized void refresh() {
        if (!isRefreshEnabled()) {
            return;
        }
        long started = System.currentTimeMillis();
        try {
            S snapshot = loadSnapshot();
            replaceSnapshot(snapshot);
            logRefreshSuccess(snapshot, System.currentTimeMillis() - started);
        } catch (RuntimeException e) {
            LogUtil.error(logSource(), refreshFailedMessage(), e);
            if (e instanceof CacheRefreshException cre) {
                throw cre;
            }
            throw new CacheRefreshException(refreshFailedMessage(), e);
        }
    }

    protected boolean isRefreshEnabled() {
        return true;
    }

    protected abstract S loadSnapshot();

    protected abstract void replaceSnapshot(S snapshot);

    protected abstract Class<?> logSource();

    protected abstract void logRefreshSuccess(S snapshot, long elapsedMs);

    protected String refreshFailedMessage() {
        return "Cache refresh failed";
    }
}
