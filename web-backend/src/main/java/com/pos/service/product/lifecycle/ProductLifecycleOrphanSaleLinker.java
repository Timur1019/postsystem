package com.pos.service.product.lifecycle;

import com.pos.domain.StockMovementType;
import com.pos.entity.Sale;
import com.pos.entity.SaleItem;
import com.pos.entity.StockMovement;
import com.pos.repository.SaleRepository;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Связывает старые движения SALE/RETURN без {@code reference_id} с чеком по товару, количеству и времени.
 */
@Component
public class ProductLifecycleOrphanSaleLinker {

    private static final Duration MATCH_WINDOW = Duration.ofMinutes(10);

    private final SaleRepository saleRepository;

    public ProductLifecycleOrphanSaleLinker(SaleRepository saleRepository) {
        this.saleRepository = saleRepository;
    }

    public Map<UUID, Sale> linkOrphanMovements(UUID productId, List<StockMovement> movements) {
        List<StockMovement> orphans = movements.stream()
            .filter(m -> m.getReferenceId() == null)
            .filter(m -> StockMovementType.SALE.equals(m.getMovementType())
                || StockMovementType.RETURN.equals(m.getMovementType()))
            .toList();
        if (orphans.isEmpty()) {
            return Map.of();
        }

        Instant min = orphans.stream()
            .map(StockMovement::getCreatedAt)
            .min(Comparator.naturalOrder())
            .orElse(Instant.EPOCH)
            .minus(MATCH_WINDOW);
        Instant max = orphans.stream()
            .map(StockMovement::getCreatedAt)
            .max(Comparator.naturalOrder())
            .orElse(Instant.now())
            .plus(MATCH_WINDOW);

        List<Sale> candidates = saleRepository.findSalesWithProductBetween(productId, min, max);
        Map<UUID, Sale> linked = new HashMap<>();
        Set<String> usedItemKeys = new HashSet<>();

        for (StockMovement movement : orphans) {
            findBestMatch(movement, productId, candidates, usedItemKeys)
                .ifPresent(sale -> linked.put(movement.getId(), sale));
        }
        return linked;
    }

    private static java.util.Optional<Sale> findBestMatch(
        StockMovement movement,
        UUID productId,
        List<Sale> candidates,
        Set<String> usedItemKeys
    ) {
        long bestMillis = Long.MAX_VALUE;
        Sale best = null;
        String bestKey = null;

        for (Sale sale : candidates) {
            if (sale.getCreatedAt() == null || movement.getCreatedAt() == null) {
                continue;
            }
            long deltaMillis = Math.abs(
                Duration.between(sale.getCreatedAt(), movement.getCreatedAt()).toMillis()
            );
            if (deltaMillis > MATCH_WINDOW.toMillis()) {
                continue;
            }
            for (SaleItem item : sale.getItems()) {
                if (item.getProduct() == null || !productId.equals(item.getProduct().getId())) {
                    continue;
                }
                if (!quantityMatches(movement, item)) {
                    continue;
                }
                String key = sale.getId() + ":" + item.getId();
                if (usedItemKeys.contains(key)) {
                    continue;
                }
                if (deltaMillis < bestMillis) {
                    bestMillis = deltaMillis;
                    best = sale;
                    bestKey = key;
                }
            }
        }
        if (best != null && bestKey != null) {
            usedItemKeys.add(bestKey);
            return java.util.Optional.of(best);
        }
        return java.util.Optional.empty();
    }

    private static boolean quantityMatches(StockMovement movement, SaleItem item) {
        int qty = Math.abs(movement.getQuantity());
        if (StockMovementType.SALE.equals(movement.getMovementType())) {
            return movement.getQuantity() < 0 && item.getQuantity() == qty;
        }
        if (StockMovementType.RETURN.equals(movement.getMovementType())) {
            return movement.getQuantity() > 0 && item.getReturnedQuantity() >= qty;
        }
        return false;
    }
}
