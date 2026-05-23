package com.pos.cache.analytics;

import java.util.Optional;

public interface ReportAnalyticsCache {

    Optional<ReportAnalyticsSnapshot> current(Integer companyId);

    void replace(Integer companyId, ReportAnalyticsSnapshot snapshot);

    void clear(Integer companyId);

    boolean hasAny();
}
