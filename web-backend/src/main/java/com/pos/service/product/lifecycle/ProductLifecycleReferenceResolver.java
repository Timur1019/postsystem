package com.pos.service.product.lifecycle;

import com.pos.domain.StockMovementType;
import com.pos.dto.product.ProductLifecycleReferenceLabel;
import com.pos.dto.product.ProductLifecycleReferences;
import com.pos.entity.Sale;
import com.pos.entity.StockMovement;
import com.pos.service.product.lifecycle.reference.LifecycleReferenceContributor;
import com.pos.service.product.lifecycle.reference.SaleLifecycleReferenceLoader;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Связь движения склада с документом-источником (чек, приёмка, инвентаризация, перемещение).
 * Новый тип документа = новый {@link LifecycleReferenceContributor}, резолвер править не нужно.
 */
@Component
@RequiredArgsConstructor
public class ProductLifecycleReferenceResolver {

    private final SaleLifecycleReferenceLoader saleLoader;
    private final List<LifecycleReferenceContributor> contributors;

    public ProductLifecycleReferences resolveForMovements(List<StockMovement> movements) {
        Set<UUID> ids = movements.stream()
            .map(StockMovement::getReferenceId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        Map<UUID, ProductLifecycleReferenceLabel> labels = new HashMap<>();
        Map<UUID, Sale> salesById = new HashMap<>();
        if (ids.isEmpty()) {
            return new ProductLifecycleReferences(labels, salesById);
        }

        SaleLifecycleReferenceLoader.Result sales = saleLoader.load(ids);
        labels.putAll(sales.labels());
        salesById.putAll(sales.sales());

        for (LifecycleReferenceContributor contributor : contributors) {
            for (Map.Entry<UUID, ProductLifecycleReferenceLabel> entry : contributor.resolve(ids).entrySet()) {
                labels.putIfAbsent(entry.getKey(), entry.getValue());
            }
        }
        return new ProductLifecycleReferences(labels, salesById);
    }

    public ProductLifecycleReferenceLabel resolve(
        StockMovement movement,
        Map<UUID, ProductLifecycleReferenceLabel> byReferenceId
    ) {
        if (movement.getReferenceId() == null) {
            return ProductLifecycleReferenceLabel.none();
        }
        ProductLifecycleReferenceLabel ref = byReferenceId.get(movement.getReferenceId());
        if (ref != null) {
            return ref;
        }
        return MovementTypeFallback.forType(movement.getMovementType());
    }

    /**
     * Резервный label по типу движения, если документ удалён/не найден. Закрыто для модификации:
     * добавление нового типа = новая константа.
     */
    private enum MovementTypeFallback {
        SALE_LIKE(Set.of(StockMovementType.SALE, StockMovementType.RETURN), "SALE"),
        RESTOCK(Set.of(StockMovementType.RESTOCK), "RECEIPT"),
        ADJUSTMENT(Set.of(StockMovementType.ADJUSTMENT), "ADJUSTMENT");

        private final Set<String> types;
        private final String label;

        MovementTypeFallback(Set<String> types, String label) {
            this.types = types;
            this.label = label;
        }

        static ProductLifecycleReferenceLabel forType(String movementType) {
            for (MovementTypeFallback fallback : values()) {
                if (fallback.types.contains(movementType)) {
                    return new ProductLifecycleReferenceLabel(fallback.label, null);
                }
            }
            return ProductLifecycleReferenceLabel.none();
        }
    }
}
