package com.pos.cache.analytics;

import com.pos.cache.support.TenantSnapshotCache;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class ReportAnalyticsCacheImpl implements ReportAnalyticsCache {

    private final TenantSnapshotCache<ReportAnalyticsSnapshot> snapshots = new TenantSnapshotCache<>();

    @Override
    public Optional<ReportAnalyticsSnapshot> current(Integer companyId) {
        return snapshots.current(companyId);
    }

    @Override
    public void replace(Integer companyId, ReportAnalyticsSnapshot snapshot) {
        snapshots.replace(companyId, snapshot);
    }

    @Override
    public void clear(Integer companyId) {
        snapshots.clear(companyId);
    }

    @Override
    public boolean hasAny() {
        return snapshots.hasAny();
    }
}
