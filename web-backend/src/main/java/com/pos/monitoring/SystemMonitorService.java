package com.pos.monitoring;

import com.pos.dto.monitoring.LogEventDto;
import com.pos.dto.monitoring.MetricDetail;
import com.pos.dto.monitoring.MetricSummary;
import com.pos.dto.monitoring.SystemOverviewResponse;

import java.util.List;
import java.util.Optional;

/**
 * Source of system telemetry for the super-admin monitoring page.
 * Реализация скрыта за интерфейсом, чтобы можно было подменить
 * (например, тестами или альтернативным backend-ом).
 */
public interface SystemMonitorService {

    SystemOverviewResponse overview();

    List<MetricSummary> listMetrics(String search);

    Optional<MetricDetail> metricDetail(String name);

    List<LogEventDto> recentLogs(int limit, String level);

    void clearLogs();
}
