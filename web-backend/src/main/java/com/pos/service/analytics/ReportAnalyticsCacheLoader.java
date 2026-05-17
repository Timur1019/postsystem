package com.pos.service.analytics;

import com.pos.cache.analytics.ReportAnalyticsSnapshot;

public interface ReportAnalyticsCacheLoader {

    ReportAnalyticsSnapshot loadSnapshot();
}
