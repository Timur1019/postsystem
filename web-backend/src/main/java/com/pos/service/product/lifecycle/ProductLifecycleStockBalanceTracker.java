package com.pos.service.product.lifecycle;

import com.pos.repository.stock.StockMovementQueryRepository;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Расчёт остатка после каждой операции по полной хронологии движений товара.
 */
@Component
public class ProductLifecycleStockBalanceTracker {

    private final StockMovementQueryRepository stockMovementQueryRepository;

    public ProductLifecycleStockBalanceTracker(StockMovementQueryRepository stockMovementQueryRepository) {
        this.stockMovementQueryRepository = stockMovementQueryRepository;
    }

    public Map<UUID, Integer> stockAfterByMovementId(UUID productId) {
        List<Object[]> timeline = stockMovementQueryRepository.findProductMovementTimeline(productId);
        int balance = 0;
        Map<UUID, Integer> after = new HashMap<>();
        for (Object[] row : timeline) {
            UUID id = (UUID) row[0];
            int qty = ((Number) row[2]).intValue();
            balance += qty;
            after.put(id, balance);
        }
        return after;
    }
}
