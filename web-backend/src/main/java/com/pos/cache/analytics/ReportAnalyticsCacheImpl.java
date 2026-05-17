package com.pos.cache.analytics;

import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

@Component
public class ReportAnalyticsCacheImpl implements ReportAnalyticsCache {

    private final AtomicReference<ReportAnalyticsSnapshot> snapshot = new AtomicReference<>();

    @Override
    public Optional<ReportAnalyticsSnapshot> current() {
        return Optional.ofNullable(snapshot.get());
    }

    @Override
    public void replace(ReportAnalyticsSnapshot snapshot) {
        this.snapshot.set(snapshot);
    }

    @Override
    public void clear() {
        snapshot.set(null);
    }
}
