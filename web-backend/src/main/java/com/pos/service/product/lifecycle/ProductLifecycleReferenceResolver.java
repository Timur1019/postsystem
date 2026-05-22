package com.pos.service.product.lifecycle;

import com.pos.domain.StockMovementType;
import com.pos.dto.product.ProductLifecycleReferenceLabel;
import com.pos.dto.product.ProductLifecycleReferences;
import com.pos.entity.Sale;
import com.pos.entity.StockInventory;
import com.pos.entity.StockMovement;
import com.pos.entity.StockReceipt;
import com.pos.entity.StockTransfer;
import com.pos.repository.SaleRepository;
import com.pos.repository.StockInventoryRepository;
import com.pos.repository.StockReceiptRepository;
import com.pos.repository.StockTransferRepository;
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
 */
@Component
public class ProductLifecycleReferenceResolver {

    private final SaleRepository saleRepository;
    private final StockReceiptRepository stockReceiptRepository;
    private final StockInventoryRepository stockInventoryRepository;
    private final StockTransferRepository stockTransferRepository;

    public ProductLifecycleReferenceResolver(
        SaleRepository saleRepository,
        StockReceiptRepository stockReceiptRepository,
        StockInventoryRepository stockInventoryRepository,
        StockTransferRepository stockTransferRepository
    ) {
        this.saleRepository = saleRepository;
        this.stockReceiptRepository = stockReceiptRepository;
        this.stockInventoryRepository = stockInventoryRepository;
        this.stockTransferRepository = stockTransferRepository;
    }

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
        for (Sale sale : saleRepository.findAllById(ids)) {
            labels.put(sale.getId(), new ProductLifecycleReferenceLabel("SALE", sale.getReceiptNumber()));
            salesById.put(sale.getId(), sale);
        }
        for (StockReceipt receipt : stockReceiptRepository.findAllById(ids)) {
            labels.putIfAbsent(receipt.getId(), new ProductLifecycleReferenceLabel("RECEIPT", receipt.getReceiptNumber()));
        }
        for (StockInventory inv : stockInventoryRepository.findAllById(ids)) {
            labels.putIfAbsent(inv.getId(), new ProductLifecycleReferenceLabel("INVENTORY", inv.getInventoryNumber()));
        }
        for (StockTransfer tr : stockTransferRepository.findAllById(ids)) {
            labels.putIfAbsent(tr.getId(), new ProductLifecycleReferenceLabel("TRANSFER", tr.getTransferNumber()));
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
        return fallbackByMovementType(movement.getMovementType());
    }

    private static ProductLifecycleReferenceLabel fallbackByMovementType(String movementType) {
        if (StockMovementType.SALE.equals(movementType) || StockMovementType.RETURN.equals(movementType)) {
            return new ProductLifecycleReferenceLabel("SALE", null);
        }
        if (StockMovementType.RESTOCK.equals(movementType)) {
            return new ProductLifecycleReferenceLabel("RECEIPT", null);
        }
        if (StockMovementType.ADJUSTMENT.equals(movementType)) {
            return new ProductLifecycleReferenceLabel("ADJUSTMENT", null);
        }
        return ProductLifecycleReferenceLabel.none();
    }
}
