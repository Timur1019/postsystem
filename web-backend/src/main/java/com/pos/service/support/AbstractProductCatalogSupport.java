package com.pos.service.support;

import com.pos.dto.product.ProductStorePriceRequest;
import com.pos.entity.Category;
import com.pos.entity.Product;
import com.pos.entity.ProductBarcode;
import com.pos.entity.ProductStorePrice;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.CategoryRepository;
import com.pos.repository.ProductBarcodeRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.spec.ProductSpecifications;
import com.pos.repository.ProductStorePriceRepository;
import com.pos.repository.StoreRepository;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Общая логика каталога товаров: загрузка сущностей, маппинг в DTO, проверки штрихкодов и цен по магазинам.
 * Один класс ответственности — «ядро каталога без сценариев импорта/экспорта и без смены остатков».
 */
public abstract class AbstractProductCatalogSupport {

    protected final ProductRepository productRepository;
    protected final ProductLookupSupport productLookup;
    protected final CategoryRepository categoryRepository;
    protected final ProductBarcodeRepository productBarcodeRepository;
    protected final ProductStorePriceRepository productStorePriceRepository;
    protected final StoreRepository storeRepository;

    protected AbstractProductCatalogSupport(
        ProductRepository productRepository,
        ProductLookupSupport productLookup,
        CategoryRepository categoryRepository,
        ProductBarcodeRepository productBarcodeRepository,
        ProductStorePriceRepository productStorePriceRepository,
        StoreRepository storeRepository
    ) {
        this.productRepository = productRepository;
        this.productLookup = productLookup;
        this.categoryRepository = categoryRepository;
        this.productBarcodeRepository = productBarcodeRepository;
        this.productStorePriceRepository = productStorePriceRepository;
        this.storeRepository = storeRepository;
    }

    protected Product findById(UUID id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }

    protected Product findDetailed(UUID id) {
        Product p = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        initCatalogCollections(p);
        return p;
    }

    /** Подгружает storePrices (+ store) и extraBarcodes в рамках текущей read-only транзакции. */
    protected void initCatalogCollections(Product p) {
        if (p.getStorePrices() != null) {
            for (ProductStorePrice sp : p.getStorePrices()) {
                Store st = sp.getStore();
                if (st != null) {
                    st.getName();
                }
            }
        }
        if (p.getExtraBarcodes() != null) {
            p.getExtraBarcodes().size();
        }
    }

    protected Map<UUID, Integer> loadStoreCounts(List<Product> products) {
        if (products.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = products.stream().map(Product::getId).toList();
        List<Object[]> rows = productStorePriceRepository.countStoresByProductIds(ids);
        Map<UUID, Integer> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((UUID) row[0], ((Number) row[1]).intValue());
        }
        return map;
    }

    protected void assertNoDuplicateBarcodesInRequest(List<String> extras, String primaryBarcode) {
        LinkedHashSet<String> seen = new LinkedHashSet<>();
        if (StringUtils.hasText(primaryBarcode)) {
            seen.add(primaryBarcode.trim());
        }
        if (extras == null) {
            return;
        }
        for (String raw : extras) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            String b = raw.trim();
            if (!seen.add(b)) {
                throw new BadRequestException("Duplicate barcode in request: " + b);
            }
        }
    }

    protected void assertBarcodeUniqueness(Integer companyId, String barcode, UUID ignoreProductId) {
        if (!StringUtils.hasText(barcode) || companyId == null) {
            return;
        }
        String normalized = barcode.trim();
        productLookup.findOne(ProductSpecifications.lookup(companyId).barcode(normalized).anyActiveState())
            .filter(pr -> ignoreProductId == null || !pr.getId().equals(ignoreProductId))
            .ifPresent(pr -> {
                throw new BadRequestException("Barcode already in use: " + normalized);
            });
        productBarcodeRepository.findByBarcodeAndProductCompanyId(normalized, companyId)
            .filter(pb -> ignoreProductId == null || !pb.getProduct().getId().equals(ignoreProductId))
            .ifPresent(pb -> {
                throw new BadRequestException("Barcode already in use: " + normalized);
            });
    }

    protected void assertAdditionalBarcodesUnique(
        Integer companyId,
        List<String> extras,
        String primaryBarcode,
        UUID ignoreProductId
    ) {
        if (extras == null) {
            return;
        }
        for (String raw : extras) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            String b = raw.trim();
            if (StringUtils.hasText(primaryBarcode) && primaryBarcode.trim().equals(b)) {
                continue;
            }
            assertBarcodeUniqueness(companyId, b, ignoreProductId);
        }
    }

    protected void applyStorePrices(Product product, List<ProductStorePriceRequest> rows) {
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
                .orElseThrow(() -> new ResourceNotFoundException("Store not found: " + row.storeId()));
            product.getStorePrices().add(ProductStorePrice.builder()
                .product(product)
                .store(store)
                .price(row.price())
                .build());
        }
    }

    protected void applyExtraBarcodes(Product product, List<String> extras, String primaryBarcode) {
        if (extras == null) {
            return;
        }
        product.getExtraBarcodes().clear();
        String primary = StringUtils.hasText(primaryBarcode) ? primaryBarcode.trim() : null;
        for (String raw : extras) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            String b = raw.trim();
            if (primary != null && primary.equals(b)) {
                continue;
            }
            ProductBarcode pb = ProductBarcode.builder()
                .product(product)
                .barcode(b)
                .build();
            product.getExtraBarcodes().add(pb);
        }
    }
}
