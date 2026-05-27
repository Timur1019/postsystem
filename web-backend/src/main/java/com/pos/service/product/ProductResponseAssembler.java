package com.pos.service.product;

import com.pos.dto.product.ProductResponse;
import com.pos.dto.product.ProductStorePriceRow;
import com.pos.entity.Product;
import com.pos.mapper.ProductMapper;
import com.pos.mapper.ProductStorePriceMapper;
import com.pos.repository.ProductStorePriceRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.repository.projection.ProductDispatchedSum;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProductResponseAssembler {

    private final ProductMapper productMapper;
    private final ProductStorePriceMapper productStorePriceMapper;
    private final ProductStorePriceRepository productStorePriceRepository;
    private final StockMovementRepository stockMovementRepository;

    public ProductResponse toResponse(Product product) {
        return toResponse(product, null, null);
    }

    public ProductResponse toResponse(
        Product product,
        Map<UUID, Integer> storeCounts,
        Map<UUID, Integer> dispatchedByProduct
    ) {
        int storesCount = storeCounts != null
            ? storeCounts.getOrDefault(product.getId(), 0)
            : (int) productStorePriceRepository.countByProduct_Id(product.getId());
        int stockDispatched = dispatchedByProduct != null
            ? dispatchedByProduct.getOrDefault(product.getId(), 0)
            : (int) stockMovementRepository.sumDispatchedByProductId(product.getId());
        List<ProductStorePriceRow> storePrices = product.getStorePrices() == null
            ? List.of()
            : productStorePriceMapper.toRowList(product.getStorePrices());
        return withStockDispatched(
            productMapper.toResponse(
                product,
                storesCount,
                productMapper.mergeBarcodes(product),
                storePrices
            ),
            stockDispatched
        );
    }

    public ProductResponse withSellingPrice(ProductResponse base, BigDecimal sellingPrice) {
        return new ProductResponse(
            base.id(), base.sku(), base.name(), base.description(), base.categoryId(), base.categoryName(),
            base.costPrice(), sellingPrice, base.defaultDiscountPercent(), base.taxRate(), base.stockQuantity(),
            base.stockDispatched(), base.lowStockAlert(), base.lowStock(),
            base.barcode(), base.barcodes(), base.imageUrl(), base.active(), base.createdAt(), base.externalProductId(),
            base.ikpu(), base.ikpuStatus(), base.unitOfMeasure(), base.unitMeasureCode(), base.packageCode(),
            base.soldIndividually(), base.markedProduct(), base.storageLocation(), base.ownerType(),
            base.commissionTin(), base.commissionPinfl(), base.storesCount(), base.storePrices()
        );
    }

    public ProductResponse withStockQuantity(ProductResponse base, int stockQuantity) {
        return new ProductResponse(
            base.id(), base.sku(), base.name(), base.description(), base.categoryId(), base.categoryName(),
            base.costPrice(), base.sellingPrice(), base.defaultDiscountPercent(), base.taxRate(), stockQuantity,
            base.stockDispatched(), base.lowStockAlert(), stockQuantity <= base.lowStockAlert(),
            base.barcode(), base.barcodes(), base.imageUrl(), base.active(), base.createdAt(), base.externalProductId(),
            base.ikpu(), base.ikpuStatus(), base.unitOfMeasure(), base.unitMeasureCode(), base.packageCode(),
            base.soldIndividually(), base.markedProduct(), base.storageLocation(), base.ownerType(),
            base.commissionTin(), base.commissionPinfl(), base.storesCount(), base.storePrices()
        );
    }

    public Map<UUID, Integer> loadDispatchedCounts(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = products.stream().map(Product::getId).distinct().toList();
        return stockMovementRepository.sumDispatchedByProductIds(ids).stream()
            .collect(Collectors.toMap(
                ProductDispatchedSum::getProductId,
                row -> row.getDispatched() != null ? row.getDispatched().intValue() : 0
            ));
    }

    private static ProductResponse withStockDispatched(ProductResponse r, int stockDispatched) {
        return new ProductResponse(
            r.id(), r.sku(), r.name(), r.description(), r.categoryId(), r.categoryName(),
            r.costPrice(), r.sellingPrice(), r.defaultDiscountPercent(), r.taxRate(), r.stockQuantity(), stockDispatched,
            r.lowStockAlert(), r.lowStock(),
            r.barcode(), r.barcodes(), r.imageUrl(), r.active(), r.createdAt(), r.externalProductId(),
            r.ikpu(), r.ikpuStatus(), r.unitOfMeasure(), r.unitMeasureCode(), r.packageCode(),
            r.soldIndividually(), r.markedProduct(), r.storageLocation(), r.ownerType(),
            r.commissionTin(), r.commissionPinfl(), r.storesCount(), r.storePrices()
        );
    }
}
