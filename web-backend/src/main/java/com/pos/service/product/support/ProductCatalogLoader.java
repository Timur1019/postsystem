package com.pos.service.product.support;

import com.pos.entity.Product;
import com.pos.entity.ProductStorePrice;
import com.pos.entity.Store;
import com.pos.exception.PosExceptions;
import com.pos.repository.ProductRepository;
import com.pos.repository.ProductStorePriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ProductCatalogLoader {

    private final ProductRepository productRepository;
    private final ProductStorePriceRepository productStorePriceRepository;

    public Product requireById(UUID id) {
        return productRepository.findById(id)
            .orElseThrow(() -> PosExceptions.notFound("Product", id));
    }

    public Product requireDetailed(UUID id) {
        Product product = requireById(id);
        initCollections(product);
        return product;
    }

    /** Инициализация lazy-коллекций в рамках текущей транзакции (open-in-view: false). */
    public void initCollections(Product product) {
        if (product.getStorePrices() != null) {
            for (ProductStorePrice line : product.getStorePrices()) {
                Store store = line.getStore();
                if (store != null) {
                    store.getName();
                }
            }
        }
        if (product.getExtraBarcodes() != null) {
            product.getExtraBarcodes().size();
        }
    }

    public Map<UUID, Integer> loadStoreCounts(List<Product> products) {
        if (products.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = products.stream().map(Product::getId).toList();
        Map<UUID, Integer> counts = new HashMap<>();
        for (Object[] row : productStorePriceRepository.countStoresByProductIds(ids)) {
            counts.put((UUID) row[0], ((Number) row[1]).intValue());
        }
        return counts;
    }
}
