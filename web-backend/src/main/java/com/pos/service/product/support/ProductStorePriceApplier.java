package com.pos.service.product.support;

import com.pos.dto.product.ProductStorePriceRequest;
import com.pos.entity.Product;
import com.pos.entity.ProductBarcode;
import com.pos.entity.ProductStorePrice;
import com.pos.entity.Store;
import com.pos.exception.PosExceptions;
import com.pos.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ProductStorePriceApplier {

    private final StoreRepository storeRepository;

    public void applyStorePrices(Product product, List<ProductStorePriceRequest> rows) {
        if (rows == null) {
            return;
        }
        Map<Integer, ProductStorePriceRequest> requested = new LinkedHashMap<>();
        for (ProductStorePriceRequest row : rows) {
            requested.put(row.storeId(), row);
        }

        Iterator<ProductStorePrice> existing = product.getStorePrices().iterator();
        while (existing.hasNext()) {
            ProductStorePrice line = existing.next();
            int storeId = line.getStore().getId();
            ProductStorePriceRequest update = requested.remove(storeId);
            if (update == null) {
                existing.remove();
            } else {
                line.setPrice(update.price());
            }
        }

        for (ProductStorePriceRequest row : requested.values()) {
            Store store = storeRepository.findById(row.storeId())
                .orElseThrow(() -> PosExceptions.notFound("Store", row.storeId()));
            product.getStorePrices().add(ProductStorePrice.builder()
                .product(product)
                .store(store)
                .price(row.price())
                .build());
        }
    }

    public void applyExtraBarcodes(Product product, List<String> extras, String primaryBarcode) {
        if (extras == null) {
            return;
        }
        product.getExtraBarcodes().clear();
        String primary = StringUtils.hasText(primaryBarcode) ? primaryBarcode.trim() : null;
        for (String raw : extras) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            String barcode = raw.trim();
            if (primary != null && primary.equals(barcode)) {
                continue;
            }
            product.getExtraBarcodes().add(ProductBarcode.builder()
                .product(product)
                .barcode(barcode)
                .build());
        }
    }

    /**
     * Если в запросе нет цен по магазинам — обновляет строки, совпадавшие со старой ценой продажи или себестоимостью.
     */
    public void syncWithSellingPrice(Product product, BigDecimal oldSelling, BigDecimal newSelling) {
        if (newSelling == null || product.getStorePrices() == null) {
            return;
        }
        BigDecimal cost = product.getCostPrice();
        for (ProductStorePrice line : product.getStorePrices()) {
            BigDecimal price = line.getPrice();
            if (price == null) {
                line.setPrice(newSelling);
                continue;
            }
            boolean matchedOld = oldSelling != null && price.compareTo(oldSelling) == 0;
            boolean matchedCost = cost != null
                && price.compareTo(cost) == 0
                && cost.compareTo(newSelling) != 0;
            if (matchedOld || matchedCost) {
                line.setPrice(newSelling);
            }
        }
    }
}
