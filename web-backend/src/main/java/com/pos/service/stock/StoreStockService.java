package com.pos.service.stock;

import com.pos.domain.SaleType;
import com.pos.entity.Product;
import com.pos.entity.Store;
import com.pos.entity.StoreStock;
import com.pos.exception.BadRequestException;
import com.pos.repository.StoreRepository;
import com.pos.repository.StoreStockRepository;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final TenantAccessSupport tenantAccess;

    public BigDecimal getQuantity(UUID productId, Integer storeId) {
        if (productId == null || storeId == null) {
            return BigDecimal.ZERO.setScale(QuantityUtil.SCALE);
        }
        return storeStockRepository.findByProductIdAndStoreId(productId, storeId)
            .map(StoreStock::getQuantity)
            .map(QuantityUtil::normalize)
            .orElse(BigDecimal.ZERO.setScale(QuantityUtil.SCALE));
    }

    public Map<UUID, BigDecimal> getQuantities(Collection<UUID> productIds, Integer storeId) {
        if (productIds == null || productIds.isEmpty() || storeId == null) {
            return Map.of();
        }
        Map<UUID, BigDecimal> map = new HashMap<>();
        for (Object[] row : storeStockRepository.quantitiesByStoreAndProductIds(storeId, productIds)) {
            map.put((UUID) row[0], QuantityUtil.normalizeFromNumber((Number) row[1]));
        }
        return map;
    }

    public void requireAvailable(Product product, Store store, BigDecimal quantity) {
        if (!com.pos.util.StockCalculator.tracksStock(product)) {
            return;
        }
        if (store == null) {
            throw new BadRequestException("Store is required for stock operations");
        }
        BigDecimal requested = QuantityUtil.normalize(quantity);
        BigDecimal available = getQuantity(product.getId(), store.getId());
        if (available.compareTo(requested) < 0) {
            String unit = product.getSaleType() == SaleType.WEIGHT
                ? " " + (product.getUnitCode() != null ? product.getUnitCode().displayLabel() : "kg")
                : "";
            throw new BadRequestException(
                "Insufficient stock for: " + product.getName() + ". Available: " + available + unit
            );
        }
    }

    public Store resolveStoreForProduct(Product product, Integer storeId) {
        if (storeId != null) {
            Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BadRequestException("Store not found"));
            tenantAccess.assertCanAccessStore(store);
            if (product.getCompany() != null
                && store.getCompany() != null
                && !product.getCompany().getId().equals(store.getCompany().getId())) {
                throw new BadRequestException("Store does not belong to product company");
            }
            return store;
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

    public void setQuantity(Product product, Store store, BigDecimal quantity) {
        if (store == null) {
            throw new BadRequestException("Store is required for stock operations");
        }
        BigDecimal q = QuantityUtil.normalize(quantity);
        if (q.signum() < 0) {
            throw new BadRequestException("Quantity cannot be negative");
        }
        StoreStock stock = storeStockRepository.findByProductIdAndStoreId(product.getId(), store.getId())
            .orElseGet(() -> StoreStock.builder().product(product).store(store).quantity(BigDecimal.ZERO).build());
        stock.setQuantity(q);
        storeStockRepository.save(stock);
        syncProductTotal(product);
    }

    public void decrease(Product product, Store store, BigDecimal quantity) {
        if (!com.pos.util.StockCalculator.tracksStock(product)) {
            return;
        }
        BigDecimal q = QuantityUtil.normalize(quantity);
        StoreStock stock = storeStockRepository.findByProductIdAndStoreId(product.getId(), store.getId())
            .orElseGet(() -> StoreStock.builder()
                .product(product)
                .store(store)
                .quantity(BigDecimal.ZERO)
                .build());
        stock.setQuantity(QuantityUtil.normalize(stock.getQuantity().subtract(q)));
        storeStockRepository.save(stock);
        syncProductTotal(product);
    }

    public void increase(Product product, Store store, BigDecimal quantity) {
        if (!com.pos.util.StockCalculator.tracksStock(product)) {
            return;
        }
        BigDecimal q = QuantityUtil.normalize(quantity);
        StoreStock stock = storeStockRepository.findByProductIdAndStoreId(product.getId(), store.getId())
            .orElseGet(() -> StoreStock.builder()
                .product(product)
                .store(store)
                .quantity(BigDecimal.ZERO)
                .build());
        stock.setQuantity(QuantityUtil.normalize(stock.getQuantity().add(q)));
        storeStockRepository.save(stock);
        syncProductTotal(product);
    }

    public void initializeForStore(Product product, Store store, BigDecimal quantity) {
        StoreStock stock = storeStockRepository.findByProductIdAndStoreId(product.getId(), store.getId())
            .orElseGet(() -> StoreStock.builder().product(product).store(store).quantity(BigDecimal.ZERO).build());
        stock.setQuantity(QuantityUtil.normalize(quantity));
        storeStockRepository.save(stock);
        syncProductTotal(product);
    }

    public void initializeForCompanyStores(Product product, Integer companyId, BigDecimal quantity) {
        syncProductTotal(product);
    }

    public Store requireStoreForCompany(Integer companyId, Integer storeId) {
        if (companyId == null) {
            throw new BadRequestException("Company is required");
        }
        if (storeId != null) {
            Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BadRequestException("Store not found"));
            tenantAccess.assertCanAccessStore(store);
            if (store.getCompany() == null || !store.getCompany().getId().equals(companyId)) {
                throw new BadRequestException("Store does not belong to your company");
            }
            return store;
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
        BigDecimal total = storeStockRepository.sumQuantityByProductAndCompany(
            product.getId(),
            product.getCompany().getId()
        );
        product.setStockQuantity(QuantityUtil.normalize(total));
    }
}
