package com.pos.service.product.impl;

import com.pos.dto.product.ProductLifecycleResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.Product;
import com.pos.entity.Sale;
import com.pos.exception.PosExceptions;
import com.pos.mapper.ProductLifecycleMapper;
import com.pos.repository.ProductRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.service.product.ProductLifecycleService;
import com.pos.service.product.lifecycle.ProductLifecycleDateRange;
import com.pos.service.product.lifecycle.ProductLifecycleMovementTypeFilter;
import com.pos.service.product.lifecycle.ProductLifecycleOrphanSaleLinker;
import com.pos.service.product.lifecycle.ProductLifecycleReferenceResolver;
import com.pos.service.product.lifecycle.ProductLifecycleStockBalanceTracker;
import com.pos.service.product.lifecycle.ProductLifecycleSummaryBuilder;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductLifecycleServiceImpl implements ProductLifecycleService {

    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductLifecycleSummaryBuilder summaryBuilder;
    private final ProductLifecycleStockBalanceTracker stockBalanceTracker;
    private final ProductLifecycleReferenceResolver referenceResolver;
    private final ProductLifecycleOrphanSaleLinker orphanSaleLinker;
    private final ProductLifecycleMapper lifecycleMapper;
    private final TenantAccessSupport tenantAccess;

    @Override
    public ProductLifecycleResponse lifecycle(
        UUID productId,
        LocalDate from,
        LocalDate to,
        String movementType,
        Integer storeId,
        Pageable pageable
    ) {
        LogUtil.debug(
            ProductLifecycleServiceImpl.class,
            "Product lifecycle request: productId={} from={} to={} type={} storeId={} page={}",
            productId,
            from,
            to,
            movementType,
            storeId,
            pageable.getPageNumber()
        );

        Product product = loadProduct(productId);
        ProductLifecycleDateRange range = ProductLifecycleDateRange.resolve(from, to, product);
        String typeFilter = ProductLifecycleMovementTypeFilter.normalize(movementType);

        var summary = summaryBuilder.build(
            product,
            range.startInclusive(),
            range.endExclusive(),
            storeId
        );
        Map<UUID, Integer> stockAfterByMovementId = stockBalanceTracker.stockAfterByMovementId(productId);

        var movementPage = stockMovementRepository.findProductMovements(
            productId,
            range.startInclusive(),
            range.endExclusive(),
            typeFilter,
            storeId,
            pageable
        );
        var references = referenceResolver.resolveForMovements(movementPage.getContent());
        var orphanSales = orphanSaleLinker.linkOrphanMovements(productId, movementPage.getContent());
        BigDecimal unitCost = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;

        var eventPage = movementPage.map(movement -> {
            var ref = referenceResolver.resolve(movement, references.labelsByReferenceId());
            Sale linkedSale = resolveLinkedSale(movement, references.salesByReferenceId(), orphanSales);
            var ctx = lifecycleMapper.toEventContext(
                movement,
                stockAfterByMovementId.get(movement.getId()),
                ref,
                unitCost,
                linkedSale
            );
            return lifecycleMapper.toEvent(ctx);
        });

        LogUtil.info(
            ProductLifecycleServiceImpl.class,
            "Product lifecycle loaded: productId={} sku={} period={}..{} events={}/{} storeId={}",
            productId,
            product.getSku(),
            range.from(),
            range.to(),
            eventPage.getNumberOfElements(),
            eventPage.getTotalElements(),
            storeId
        );

        return new ProductLifecycleResponse(summary, PageResponse.from(eventPage));
    }

    private Product loadProduct(UUID productId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> PosExceptions.notFound("Product", productId));
        tenantAccess.assertProductBelongsToTenant(product);
        return product;
    }

    private static Sale resolveLinkedSale(
        com.pos.entity.StockMovement movement,
        Map<UUID, Sale> salesByReferenceId,
        Map<UUID, Sale> orphanSales
    ) {
        if (movement.getReferenceId() != null) {
            Sale sale = salesByReferenceId.get(movement.getReferenceId());
            if (sale != null) {
                return sale;
            }
        }
        return orphanSales.get(movement.getId());
    }
}
