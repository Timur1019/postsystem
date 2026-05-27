package com.pos.service.stock;

import com.pos.entity.Product;
import com.pos.entity.Store;
import com.pos.entity.StoreStock;
import com.pos.exception.BadRequestException;
import com.pos.repository.StoreRepository;
import com.pos.repository.StoreStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class StoreStockService {

    private final StoreStockRepository storeStockRepository;
    private final StoreRepository storeRepository;

    public int getQuantity(UUID productId, Integer storeId) {
        if (productId == null || storeId == null) {
            return 0;
        }
        return storeStockRepository.findByProductIdAndStoreId(productId, storeId)
            .map(StoreStock::getQuantity)
            .orElse(0);
    }

    public Map<UUID, Integer> getQuantities(Collection<UUID> productIds, Integer storeId) {
        if (productIds == null || productIds.isEmpty() || storeId == null) {
            return Map.of();
        }
        Map<UUID, Integer> map = new HashMap<>();
        for (Object[] row : storeStockRepository.quantitiesByStoreAndProductIds(storeId, productIds)) {
            map.put((UUID) row[0], ((Number) row[1]).intValue());
        }
        return map;
    }

    public void requireAvailable(Product product, Store store, int quantity) {
        if (store == null) {
            throw new BadRequestException("Store is required for stock operations");
        }
        int available = getQuantity(product.getId(), store.getId());
        if (available < quantity) {
            throw new BadRequestException(
                "Insufficient stock for: " + product.getName() + ". Available: " + available
            );
        }
    }

    /**
     * Resolves store for stock ops: explicit id, or the only store of the product company.
     */
    public Store resolveStoreForProduct(Product product, Integer storeId) {
        if (storeId != null) {
            return storeRepository.findById(storeId)
                .orElseThrow(() -> new BadRequestException("Store not found"));
        }
        if (product.getCompany() == null) {
            throw new BadRequestException("Product has no company");
        }
        List<Store> stores = storeRepository.findByCompanyIdOrderByNameAsc(product.getCompany().getId());
        if (stores.isEmpty()) {
            throw new BadRequestException("No stores configured for company");
        }
        if (stores.size() == 1) {
            return stores.get(0);
        }
        throw new BadRequestException("Укажите магазин (storeId)");
    }

    public void setQuantity(Product product, Store store, int quantity) {
        if (store == null) {
            throw new BadRequestException("Store is required for stock operations");
        }
        if (quantity < 0) {
            throw new BadRequestException("Quantity cannot be negative");
        }
        StoreStock stock = storeStockRepository.findByProductIdAndStoreId(product.getId(), store.getId())
            .orElseGet(() -> StoreStock.builder().product(product).store(store).quantity(0).build());
        stock.setQuantity(quantity);
        storeStockRepository.save(stock);
        syncProductTotal(product);
    }

    public void decrease(Product product, Store store, int quantity) {
        StoreStock stock = storeStockRepository.findByProductIdAndStoreId(product.getId(), store.getId())
            .orElseGet(() -> StoreStock.builder()
                .product(product)
                .store(store)
                .quantity(0)
                .build());
        stock.setQuantity(stock.getQuantity() - quantity);
        storeStockRepository.save(stock);
        syncProductTotal(product);
    }

    public void increase(Product product, Store store, int quantity) {
        StoreStock stock = storeStockRepository.findByProductIdAndStoreId(product.getId(), store.getId())
            .orElseGet(() -> StoreStock.builder()
                .product(product)
                .store(store)
                .quantity(0)
                .build());
        stock.setQuantity(stock.getQuantity() + quantity);
        storeStockRepository.save(stock);
        syncProductTotal(product);
    }

    public void initializeForStore(Product product, Store store, int quantity) {
        StoreStock stock = storeStockRepository.findByProductIdAndStoreId(product.getId(), store.getId())
            .orElseGet(() -> StoreStock.builder().product(product).store(store).quantity(0).build());
        stock.setQuantity(quantity);
        storeStockRepository.save(stock);
        syncProductTotal(product);
    }

    public void initializeForCompanyStores(Product product, Integer companyId, int quantity) {
        // caller ensures stores exist; bulk init done in migration / product create for all company stores
        syncProductTotal(product);
    }

    /** Explicit store or the only store of the company; error if several stores and id omitted. */
    public Store requireStoreForCompany(Integer companyId, Integer storeId) {
        if (companyId == null) {
            throw new BadRequestException("Company is required");
        }
        if (storeId != null) {
            return storeRepository.findById(storeId)
                .orElseThrow(() -> new BadRequestException("Store not found"));
        }
        List<Store> stores = storeRepository.findByCompanyIdOrderByNameAsc(companyId);
        if (stores.isEmpty()) {
            throw new BadRequestException("No stores configured for company");
        }
        if (stores.size() == 1) {
            return stores.get(0);
        }
        throw new BadRequestException("Укажите магазин (storeId)");
    }

    private void syncProductTotal(Product product) {
        if (product.getCompany() == null) {
            return;
        }
        int total = storeStockRepository.sumQuantityByProductAndCompany(
            product.getId(),
            product.getCompany().getId()
        );
        product.setStockQuantity(total);
    }
}
