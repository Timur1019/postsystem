package com.pos.service.product.impl;

import com.pos.dto.product.ProductResponse;
import com.pos.dto.warehouse.WarehouseReceiveRequest;
import com.pos.entity.Product;
import com.pos.entity.StockMovement;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.repository.CategoryRepository;
import com.pos.repository.ProductBarcodeRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.ProductStorePriceRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.repository.StoreRepository;
import com.pos.service.product.ProductResponseAssembler;
import com.pos.service.product.ProductStockService;
import com.pos.service.stock.StoreStockService;
import com.pos.service.support.AbstractProductCatalogSupport;
import com.pos.service.support.ProductValueNormalizer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@Transactional
public class ProductStockServiceImpl extends AbstractProductCatalogSupport implements ProductStockService {

    private final StockMovementRepository stockMovementRepository;
    private final StoreStockService storeStockService;
    private final ProductResponseAssembler assembler;

    public ProductStockServiceImpl(
        ProductRepository productRepository,
        CategoryRepository categoryRepository,
        ProductBarcodeRepository productBarcodeRepository,
        ProductStorePriceRepository productStorePriceRepository,
        StoreRepository storeRepository,
        StockMovementRepository stockMovementRepository,
        StoreStockService storeStockService,
        ProductResponseAssembler assembler
    ) {
        super(productRepository, categoryRepository, productBarcodeRepository, productStorePriceRepository, storeRepository);
        this.stockMovementRepository = stockMovementRepository;
        this.storeStockService = storeStockService;
        this.assembler = assembler;
    }

    @Override
    public ProductResponse adjustStock(UUID id, int quantity, String movementType, String notes, Integer storeId) {
        Product product = findById(id);
        Store store = storeStockService.resolveStoreForProduct(product, storeId);
        applyStockDelta(product, quantity, store);
        productRepository.save(product);
        recordStockMovement(product, quantity, movementType, notes, store);
        ProductResponse base = assembler.toResponse(product);
        return assembler.withStockQuantity(base, storeStockService.getQuantity(product.getId(), store.getId()));
    }

    @Override
    public ProductResponse receiveWarehouseStock(WarehouseReceiveRequest req) {
        Product product = findDetailed(req.productId());
        int q = req.quantity();
        if (q < 1) {
            throw new BadRequestException("Quantity must be at least 1");
        }
        Store store = storeStockService.resolveStoreForProduct(product, req.storeId());
        applyStockDelta(product, q, store);
        product.setSellingPrice(req.unitSellingPrice());
        product.setCostPrice(req.purchasePrice());
        if (req.vatPercent() != null) {
            product.setTaxRate(ProductValueNormalizer.taxRatePercent(BigDecimal.valueOf(req.vatPercent())));
        }
        product.setMarkedProduct(req.markedProduct());
        if (StringUtils.hasText(req.storageLocation())) {
            product.setStorageLocation(req.storageLocation().trim());
        }
        Product saved = productRepository.save(product);
        recordStockMovement(saved, q, "RESTOCK", "Склад: поступление", store);
        return assembler.toResponse(saved);
    }

    private void applyStockDelta(Product product, int delta, Store store) {
        if (delta == 0) {
            throw new BadRequestException("Quantity must be non-zero");
        }
        if (delta > 0) {
            storeStockService.increase(product, store, delta);
        } else {
            storeStockService.decrease(product, store, -delta);
        }
    }

    private void recordStockMovement(
        Product product,
        int quantity,
        String movementType,
        String notes,
        Store store
    ) {
        stockMovementRepository.save(StockMovement.builder()
            .product(product)
            .store(store)
            .movementType(movementType)
            .quantity(quantity)
            .notes(notes)
            .build());
    }
}
