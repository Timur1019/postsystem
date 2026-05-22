package com.pos.service.product.lifecycle;

import com.pos.dto.product.ProductLifecycleSummaryResponse;
import com.pos.entity.Product;
import com.pos.repository.StockMovementRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class ProductLifecycleSummaryBuilder {

    private final StockMovementRepository stockMovementRepository;

    public ProductLifecycleSummaryBuilder(StockMovementRepository stockMovementRepository) {
        this.stockMovementRepository = stockMovementRepository;
    }

    public ProductLifecycleSummaryResponse build(
        Product product,
        Instant start,
        Instant end,
        Integer storeId
    ) {
        ProductLifecycleTypeTotals totals = ProductLifecycleTypeTotals.fromRows(
            stockMovementRepository.sumQuantitiesByTypeForProduct(product.getId(), start, end, storeId)
        );
        long dispatched = stockMovementRepository.sumDispatchedByProductId(product.getId());

        return new ProductLifecycleSummaryResponse(
            product.getId(),
            product.getSku(),
            product.getName(),
            product.getStockQuantity(),
            dispatched,
            product.getCreatedAt(),
            totals.restockUnits(),
            totals.saleUnits(),
            totals.returnUnits(),
            totals.writeOffUnits(),
            totals.adjustmentNetUnits()
        );
    }
}
