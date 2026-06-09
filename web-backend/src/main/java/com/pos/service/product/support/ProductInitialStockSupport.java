package com.pos.service.product.support;

import com.pos.dto.product.ProductStorePriceRequest;
import com.pos.entity.Product;
import com.pos.entity.StockMovement;
import com.pos.entity.Store;
import com.pos.exception.PosExceptions;
import com.pos.repository.StockMovementRepository;
import com.pos.repository.StoreRepository;
import com.pos.service.stock.StoreStockService;
import com.pos.util.QuantityUtil;
import com.pos.util.QuantityValidator;
import com.pos.util.StockCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ProductInitialStockSupport {

    private final StoreRepository storeRepository;
    private final StoreStockService storeStockService;
    private final StockMovementRepository stockMovementRepository;

    public void applyIfPresent(
        Product product,
        BigDecimal initialStockRaw,
        List<ProductStorePriceRequest> storePrices,
        Integer companyId,
        String movementNote
    ) {
        BigDecimal initialStock = initialStockRaw != null
            ? QuantityUtil.normalize(initialStockRaw)
            : BigDecimal.ZERO;
        if (initialStock.signum() <= 0 || companyId == null || !StockCalculator.tracksStock(product)) {
            return;
        }
        QuantityValidator.validate(product, initialStock);
        List<Integer> targetStoreIds = resolveTargetStoreIds(storePrices, companyId);
        for (Integer storeId : targetStoreIds) {
            Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> PosExceptions.notFound("Store", storeId));
            storeStockService.initializeForStore(product, store, initialStock);
            recordMovement(product, initialStock, "RESTOCK", movementNote, store);
        }
    }

    private List<Integer> resolveTargetStoreIds(List<ProductStorePriceRequest> storePrices, Integer companyId) {
        List<Integer> targetStoreIds = new ArrayList<>();
        if (storePrices != null && !storePrices.isEmpty()) {
            storePrices.stream().map(ProductStorePriceRequest::storeId).distinct().forEach(targetStoreIds::add);
            return targetStoreIds;
        }
        List<Store> stores = storeRepository.findByCompanyIdOrderByNameAsc(companyId);
        if (stores.size() == 1) {
            targetStoreIds.add(stores.get(0).getId());
            return targetStoreIds;
        }
        if (stores.size() > 1) {
            throw PosExceptions.badRequest(
                "Укажите цены по магазинам (storePrices), чтобы задать начальный остаток при нескольких магазинах"
            );
        }
        return targetStoreIds;
    }

    private void recordMovement(Product product, BigDecimal quantity, String movementType, String notes, Store store) {
        stockMovementRepository.save(StockMovement.builder()
            .product(product)
            .store(store)
            .movementType(movementType)
            .quantity(QuantityUtil.normalize(quantity))
            .notes(notes)
            .build());
    }
}
