package com.pos.dto.product;

import com.pos.entity.Sale;

import java.util.Map;
import java.util.UUID;

/**
 * Документы-источники движений (чеки и др.) для журнала жизненного цикла товара.
 */
public record ProductLifecycleReferences(
    Map<UUID, ProductLifecycleReferenceLabel> labelsByReferenceId,
    Map<UUID, Sale> salesByReferenceId
) {

    public static ProductLifecycleReferences empty() {
        return new ProductLifecycleReferences(Map.of(), Map.of());
    }
}
