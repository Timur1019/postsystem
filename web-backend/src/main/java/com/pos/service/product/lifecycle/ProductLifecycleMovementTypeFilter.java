package com.pos.service.product.lifecycle;

import com.pos.domain.StockMovementType;
import com.pos.exception.PosExceptions;
import org.springframework.util.StringUtils;

import java.util.Set;

/**
 * Фильтр типа движения для API жизненного цикла (null = все типы).
 */
public final class ProductLifecycleMovementTypeFilter {

    private static final Set<String> ALLOWED = Set.of(
        StockMovementType.RESTOCK,
        StockMovementType.SALE,
        StockMovementType.RETURN,
        StockMovementType.WRITE_OFF,
        StockMovementType.ADJUSTMENT
    );

    private ProductLifecycleMovementTypeFilter() {
    }

    public static String normalize(String movementType) {
        if (!StringUtils.hasText(movementType) || "ALL".equalsIgnoreCase(movementType.trim())) {
            return null;
        }
        String normalized = movementType.trim().toUpperCase();
        if (!ALLOWED.contains(normalized)) {
            throw PosExceptions.badRequest(
                "Неизвестный тип движения: " + normalized,
                "movementType",
                normalized
            );
        }
        return normalized;
    }
}
