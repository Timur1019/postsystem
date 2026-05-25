package com.pos.dto.monitoring;

import java.util.List;
import java.util.Map;

/**
 * Полные данные метрики: список измерений (на разных тегах).
 */
public record MetricDetail(
    String name,
    String type,
    String description,
    String baseUnit,
    List<Sample> samples
) {

    public record Sample(
        Map<String, String> tags,
        Map<String, Double> measurements
    ) {
    }
}
