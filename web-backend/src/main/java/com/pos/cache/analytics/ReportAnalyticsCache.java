package com.pos.cache.analytics;

import java.util.Optional;

public interface ReportAnalyticsCache {

    Optional<ReportAnalyticsSnapshot> current();

    void replace(ReportAnalyticsSnapshot snapshot);

    void clear();
}
