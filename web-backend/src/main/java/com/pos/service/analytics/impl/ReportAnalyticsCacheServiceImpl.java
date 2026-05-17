package com.pos.service.analytics.impl;

import com.pos.cache.analytics.ReportAnalyticsCache;
import com.pos.cache.analytics.ReportAnalyticsSnapshot;
import com.pos.service.analytics.ReportAnalyticsCacheLoader;
import com.pos.service.analytics.ReportAnalyticsCacheService;
import com.pos.util.LogUtil;
import org.springframework.stereotype.Service;

@Service
public class ReportAnalyticsCacheServiceImpl implements ReportAnalyticsCacheService {

    private final ReportAnalyticsCacheLoader loader;
    private final ReportAnalyticsCache cache;

    public ReportAnalyticsCacheServiceImpl(ReportAnalyticsCacheLoader loader, ReportAnalyticsCache cache) {
        this.loader = loader;
        this.cache = cache;
    }

    @Override
    public synchronized void refresh() {
        long started = System.currentTimeMillis();
        try {
            ReportAnalyticsSnapshot snapshot = loader.loadSnapshot();
            cache.replace(snapshot);
            LogUtil.info(
                ReportAnalyticsCacheServiceImpl.class,
                "Analytics cache refreshed in {} ms ({} .. {}, {} days)",
                System.currentTimeMillis() - started,
                snapshot.windowStart(),
                snapshot.windowEnd(),
                snapshot.dailyByDate().size()
            );
        } catch (Exception e) {
            LogUtil.error(ReportAnalyticsCacheServiceImpl.class, "Analytics cache refresh failed", e);
            throw e;
        }
    }

    @Override
    public boolean isReady() {
        return cache.current().isPresent();
    }
}
