package com.pos.mapper;

import com.pos.dto.product.ProductLifecycleEventContext;
import com.pos.dto.product.ProductLifecycleEventResponse;
import com.pos.dto.product.ProductLifecycleSummaryResponse;
import com.pos.entity.Product;
import com.pos.entity.Sale;
import com.pos.entity.StockMovement;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.dto.product.ProductLifecycleReferenceLabel;
import com.pos.service.product.lifecycle.ProductLifecycleTypeTotals;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Mapper(config = PosMapperConfig.class)
public interface ProductLifecycleMapper {

    @Mapping(target = "id", source = "movement.id")
    @Mapping(target = "occurredAt", source = "movement.createdAt")
    @Mapping(target = "eventType", source = "movement.movementType")
    @Mapping(target = "quantityDelta", source = "movement.quantity")
    @Mapping(target = "stockAfter", source = "stockAfter")
    @Mapping(target = "storeId", expression = "java(storeId(ctx))")
    @Mapping(target = "storeName", expression = "java(storeName(ctx))")
    @Mapping(target = "performedBy", expression = "java(performedBy(ctx))")
    @Mapping(target = "notes", source = "movement.notes")
    @Mapping(target = "writeOffReason", source = "movement.writeOffReason")
    @Mapping(target = "referenceId", source = "movement.referenceId")
    @Mapping(target = "referenceType", expression = "java(referenceType(ctx))")
    @Mapping(target = "referenceLabel", expression = "java(referenceLabel(ctx))")
    @Mapping(target = "unitCostEstimate", source = "unitCostEstimate")
    @Mapping(target = "costDeltaEstimate", source = "costDeltaEstimate")
    ProductLifecycleEventResponse toEvent(ProductLifecycleEventContext ctx);

    default ProductLifecycleEventContext toEventContext(
        StockMovement movement,
        Integer stockAfter,
        ProductLifecycleReferenceLabel reference,
        BigDecimal unitCost,
        Sale linkedSale
    ) {
        BigDecimal cost = unitCost != null ? unitCost : BigDecimal.ZERO;
        BigDecimal costDelta = cost
            .multiply(movement.getQuantity())
            .setScale(2, RoundingMode.HALF_UP);
        return new ProductLifecycleEventContext(movement, stockAfter, reference, cost, costDelta, linkedSale);
    }

    default ProductLifecycleSummaryResponse toSummary(
        Product product,
        long stockDispatched,
        ProductLifecycleTypeTotals totals
    ) {
        return new ProductLifecycleSummaryResponse(
            product.getId(),
            product.getSku(),
            product.getName(),
            product.getStockQuantity(),
            stockDispatched,
            product.getCreatedAt(),
            totals.restockUnits(),
            totals.saleUnits(),
            totals.returnUnits(),
            totals.writeOffUnits(),
            totals.adjustmentNetUnits()
        );
    }

    default Integer storeId(ProductLifecycleEventContext ctx) {
        Store store = movementStore(ctx.movement());
        if (store != null) {
            return store.getId();
        }
        Store linked = linkedSaleStore(ctx.linkedSale());
        return linked != null ? linked.getId() : null;
    }

    default String storeName(ProductLifecycleEventContext ctx) {
        Store store = movementStore(ctx.movement());
        if (store != null) {
            return store.getName();
        }
        Store linked = linkedSaleStore(ctx.linkedSale());
        return linked != null ? linked.getName() : null;
    }

    default String performedBy(ProductLifecycleEventContext ctx) {
        User user = movementUser(ctx.movement());
        if (user != null) {
            return user.getFullName();
        }
        Sale sale = ctx.linkedSale();
        return sale != null && sale.getCashier() != null ? sale.getCashier().getFullName() : null;
    }

    default String referenceType(ProductLifecycleEventContext ctx) {
        ProductLifecycleReferenceLabel reference = ctx.reference();
        if (reference != null && reference.type() != null) {
            return reference.type();
        }
        return ctx.linkedSale() != null ? "SALE" : null;
    }

    default String referenceLabel(ProductLifecycleEventContext ctx) {
        ProductLifecycleReferenceLabel reference = ctx.reference();
        if (reference != null && reference.label() != null) {
            return reference.label();
        }
        Sale sale = ctx.linkedSale();
        return sale != null ? sale.getReceiptNumber() : null;
    }

    default Store movementStore(StockMovement movement) {
        return movement.getStore();
    }

    default User movementUser(StockMovement movement) {
        return movement.getCreatedBy();
    }

    default Store linkedSaleStore(Sale sale) {
        return sale != null ? sale.getStore() : null;
    }
}
