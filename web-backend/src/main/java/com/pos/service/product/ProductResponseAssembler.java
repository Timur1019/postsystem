package com.pos.service.product;

import com.pos.dto.product.ProductResponse;
import com.pos.dto.product.ProductStorePriceRow;
import com.pos.entity.Product;
import com.pos.mapper.ProductMapper;
import com.pos.mapper.ProductStorePriceMapper;
import com.pos.repository.ProductStorePriceRepository;
import com.pos.repository.stock.StockMovementQueryRepository;
import com.pos.repository.projection.ProductDispatchedSum;
import com.pos.service.ProductAttributeService;
import com.pos.util.QuantityUtil;
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
    private final StockMovementQueryRepository stockMovementQueryRepository;
    private final ProductExtensionMapper extensionMapper;
    private final ProductAttributeService productAttributeService;

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
            : (int) stockMovementQueryRepository.sumDispatchedByProductId(product.getId());
        List<ProductStorePriceRow> storePrices = product.getStorePrices() == null
            ? List.of()
            : productStorePriceMapper.toRowList(product.getStorePrices());
        return withStockDispatched(
            enrichExtensions(
                productMapper.toResponse(
                    product,
                    storesCount,
                    productMapper.mergeBarcodes(product),
                    storePrices
                ),
                product
            ),
            stockDispatched
        );
    }

    private ProductResponse enrichExtensions(ProductResponse base, Product product) {
        return new ProductResponse(
            base.id(),
            base.sku(),
            base.name(),
            base.description(),
            base.categoryId(),
            base.categoryName(),
            base.costPrice(),
            base.sellingPrice(),
            base.defaultDiscountPercent(),
            base.taxRate(),
            base.productType(),
            base.templateCode(),
            base.saleType(),
            base.unitCode(),
            base.quantityScale(),
            base.allowFraction(),
            base.stockQuantity(),
            base.stockDispatched(),
            base.lowStockAlert(),
            base.lowStock(),
            base.barcode(),
            base.barcodes(),
            base.imageUrl(),
            base.active(),
            base.createdAt(),
            base.externalProductId(),
            base.ikpu(),
            base.ikpuStatus(),
            base.unitOfMeasure(),
            base.unitMeasureCode(),
            base.packageCode(),
            base.soldIndividually(),
            base.markedProduct(),
            base.storageLocation(),
            base.ownerType(),
            base.commissionTin(),
            base.commissionPinfl(),
            base.storesCount(),
            base.storePrices(),
            extensionMapper.toDto(product.getConstructionDetails()),
            extensionMapper.toDto(product.getRestaurantDetails()),
            extensionMapper.toDto(product.getServiceDetails()),
            extensionMapper.toDto(product.getRetailDetails()),
            productAttributeService.getAttributes(product.getId())
        );
    }

    public ProductResponse withSellingPrice(ProductResponse base, BigDecimal sellingPrice) {
        return copy(base, base.stockQuantity(), base.stockDispatched(), base.lowStock(), sellingPrice);
    }

    public ProductResponse withStockQuantity(ProductResponse base, BigDecimal stockQuantity) {
        BigDecimal qty = QuantityUtil.normalize(stockQuantity);
        boolean low = qty.compareTo(BigDecimal.valueOf(base.lowStockAlert())) <= 0;
        return copy(base, qty, base.stockDispatched(), low, base.sellingPrice());
    }

    public Map<UUID, Integer> loadDispatchedCounts(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = products.stream().map(Product::getId).distinct().toList();
        return stockMovementQueryRepository.sumDispatchedByProductIds(ids).stream()
            .collect(Collectors.toMap(
                ProductDispatchedSum::productId,
                row -> (int) row.dispatched()
            ));
    }

    private static ProductResponse withStockDispatched(ProductResponse r, int stockDispatched) {
        return copy(r, r.stockQuantity(), stockDispatched, r.lowStock(), r.sellingPrice());
    }

    private static ProductResponse copy(
        ProductResponse r,
        BigDecimal stockQuantity,
        int stockDispatched,
        boolean lowStock,
        BigDecimal sellingPrice
    ) {
        return new ProductResponse(
            r.id(),
            r.sku(),
            r.name(),
            r.description(),
            r.categoryId(),
            r.categoryName(),
            r.costPrice(),
            sellingPrice,
            r.defaultDiscountPercent(),
            r.taxRate(),
            r.productType(),
            r.templateCode(),
            r.saleType(),
            r.unitCode(),
            r.quantityScale(),
            r.allowFraction(),
            stockQuantity,
            stockDispatched,
            r.lowStockAlert(),
            lowStock,
            r.barcode(),
            r.barcodes(),
            r.imageUrl(),
            r.active(),
            r.createdAt(),
            r.externalProductId(),
            r.ikpu(),
            r.ikpuStatus(),
            r.unitOfMeasure(),
            r.unitMeasureCode(),
            r.packageCode(),
            r.soldIndividually(),
            r.markedProduct(),
            r.storageLocation(),
            r.ownerType(),
            r.commissionTin(),
            r.commissionPinfl(),
            r.storesCount(),
            r.storePrices(),
            r.constructionDetails(),
            r.restaurantDetails(),
            r.serviceDetails(),
            r.retailExtras(),
            r.attributes()
        );
    }
}
