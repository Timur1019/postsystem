package com.pos.dto.product;

/**
 * Ссылка на документ-источник движения (чек, приёмка и т.д.).
 */
public record ProductLifecycleReferenceLabel(String type, String label) {

    public static ProductLifecycleReferenceLabel none() {
        return new ProductLifecycleReferenceLabel(null, null);
    }
}
