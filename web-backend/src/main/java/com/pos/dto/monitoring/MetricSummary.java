package com.pos.dto.monitoring;

/**
 * Краткая информация о зарегистрированном meter (для списка/поиска).
 */
public record MetricSummary(
    String name,
    String type,
    String description,
    String baseUnit
) {
}
