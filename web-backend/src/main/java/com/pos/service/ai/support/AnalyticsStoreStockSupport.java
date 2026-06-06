package com.pos.service.ai.support;

import com.pos.entity.StoreStock;
import com.pos.repository.StoreStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AnalyticsStoreStockSupport {

    private final StoreStockRepository storeStockRepository;

    public StoreStockIndex buildIndex(Integer companyId) {
        List<StoreStock> storeStocks = storeStockRepository.findAllDetailedByCompanyId(companyId);
        Map<Integer, Long> stockQtyByStore = new HashMap<>();
        Map<Integer, String> storeNameById = new HashMap<>();
        Map<String, String> productNameByStoreProduct = new HashMap<>();
        for (StoreStock ss : storeStocks) {
            Integer storeId = ss.getStore().getId();
            UUID productId = ss.getProduct().getId();
            stockQtyByStore.merge(storeId, ss.getQuantity().longValue(), Long::sum);
            storeNameById.put(storeId, ss.getStore().getName());
            productNameByStoreProduct.put(storeId + ":" + productId, ss.getProduct().getName());
        }
        return new StoreStockIndex(stockQtyByStore, storeNameById, productNameByStoreProduct);
    }

    public record StoreStockIndex(
        Map<Integer, Long> stockQtyByStore,
        Map<Integer, String> storeNameById,
        Map<String, String> productNameByStoreProduct
    ) {
    }
}
