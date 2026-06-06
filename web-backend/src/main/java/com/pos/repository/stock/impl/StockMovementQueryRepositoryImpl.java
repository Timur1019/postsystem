package com.pos.repository.stock.impl;

import com.pos.entity.StockMovement;
import com.pos.repository.projection.ProductDispatchedSum;
import com.pos.repository.stock.StockMovementQueryRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class StockMovementQueryRepositoryImpl implements StockMovementQueryRepository {

    private static final String SUM_DISPATCHED_BY_IDS_JPQL = """
        SELECT sm.product.id AS productId,
               COALESCE(SUM(CASE WHEN sm.quantity < 0 THEN -sm.quantity ELSE 0 END), 0) AS dispatched
        FROM StockMovement sm
        WHERE sm.product.id IN :productIds
        GROUP BY sm.product.id
        """;

    private static final String SUM_DISPATCHED_BY_ID_JPQL = """
        SELECT COALESCE(SUM(CASE WHEN sm.quantity < 0 THEN -sm.quantity ELSE 0 END), 0)
        FROM StockMovement sm
        WHERE sm.product.id = :productId
        """;

    private static final String FIND_PRODUCT_MOVEMENTS_JPQL = """
        SELECT sm FROM StockMovement sm
        LEFT JOIN FETCH sm.store
        LEFT JOIN FETCH sm.createdBy
        WHERE sm.product.id = :productId
          AND sm.createdAt >= :start AND sm.createdAt < :end
          AND (:movementType IS NULL OR sm.movementType = :movementType)
          AND (:storeId IS NULL OR sm.store.id = :storeId)
        ORDER BY sm.createdAt DESC
        """;

    private static final String COUNT_PRODUCT_MOVEMENTS_JPQL = """
        SELECT COUNT(sm) FROM StockMovement sm
        WHERE sm.product.id = :productId
          AND sm.createdAt >= :start AND sm.createdAt < :end
          AND (:movementType IS NULL OR sm.movementType = :movementType)
          AND (:storeId IS NULL OR sm.store.id = :storeId)
        """;

    private static final String PRODUCT_MOVEMENT_TIMELINE_JPQL = """
        SELECT sm.id, sm.createdAt, sm.quantity FROM StockMovement sm
        WHERE sm.product.id = :productId
        ORDER BY sm.createdAt ASC, sm.id ASC
        """;

    private static final String SUM_QUANTITIES_BY_TYPE_JPQL = """
        SELECT sm.movementType, COALESCE(SUM(sm.quantity), 0) FROM StockMovement sm
        WHERE sm.product.id = :productId
          AND sm.createdAt >= :start AND sm.createdAt < :end
          AND (:storeId IS NULL OR sm.store.id = :storeId)
        GROUP BY sm.movementType
        """;

    private final EntityManager entityManager;
    private final StockMovementJpaQueryExecutor jpaQueryExecutor;

    @Override
    public List<ProductDispatchedSum> sumDispatchedByProductIds(Collection<UUID> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return List.of();
        }
        return entityManager.createQuery(SUM_DISPATCHED_BY_IDS_JPQL, ProductDispatchedSum.class)
            .setParameter("productIds", productIds)
            .getResultList();
    }

    @Override
    public long sumDispatchedByProductId(UUID productId) {
        Long sum = entityManager.createQuery(SUM_DISPATCHED_BY_ID_JPQL, Long.class)
            .setParameter("productId", productId)
            .getSingleResult();
        return sum != null ? sum : 0L;
    }

    @Override
    public Page<StockMovement> findProductMovements(
        UUID productId,
        Instant start,
        Instant end,
        String movementType,
        Integer storeId,
        Pageable pageable
    ) {
        return jpaQueryExecutor.fetchPage(
            FIND_PRODUCT_MOVEMENTS_JPQL,
            COUNT_PRODUCT_MOVEMENTS_JPQL,
            query -> bindProductMovementParams(query, productId, start, end, movementType, storeId),
            pageable
        );
    }

    @Override
    public List<Object[]> findProductMovementTimeline(UUID productId) {
        return entityManager.createQuery(PRODUCT_MOVEMENT_TIMELINE_JPQL, Object[].class)
            .setParameter("productId", productId)
            .getResultList();
    }

    @Override
    public List<Object[]> sumQuantitiesByTypeForProduct(
        UUID productId,
        Instant start,
        Instant end,
        Integer storeId
    ) {
        return entityManager.createQuery(SUM_QUANTITIES_BY_TYPE_JPQL, Object[].class)
            .setParameter("productId", productId)
            .setParameter("start", start)
            .setParameter("end", end)
            .setParameter("storeId", storeId)
            .getResultList();
    }

    private static void bindProductMovementParams(
        TypedQuery<?> query,
        UUID productId,
        Instant start,
        Instant end,
        String movementType,
        Integer storeId
    ) {
        query.setParameter("productId", productId);
        query.setParameter("start", start);
        query.setParameter("end", end);
        query.setParameter("movementType", movementType);
        query.setParameter("storeId", storeId);
    }
}
