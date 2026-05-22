package com.pos.repository;

import com.pos.entity.StockMovement;
import com.pos.repository.projection.ProductDispatchedSum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    @Query("""
        SELECT COALESCE(SUM(sm.quantity), 0)
        FROM StockMovement sm
        WHERE sm.movementType = :type
          AND sm.createdAt >= :start AND sm.createdAt < :end
          AND (:storeId IS NULL OR sm.store.id = :storeId)
        """)
    long sumQuantityByTypeBetween(
        @Param("type") String type,
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("storeId") Integer storeId
    );

    @Query(value = """
        SELECT CAST(sm.created_at AS date) AS day,
               COALESCE(SUM(CASE WHEN sm.movement_type = 'RESTOCK' AND sm.quantity > 0 THEN sm.quantity ELSE 0 END), 0) AS received_units,
               COALESCE(SUM(CASE WHEN sm.movement_type = 'WRITE_OFF' AND sm.quantity < 0 THEN -sm.quantity ELSE 0 END), 0) AS write_off_units
        FROM stock_movements sm
        WHERE sm.created_at >= :start AND sm.created_at < :end
          AND (:storeId IS NULL OR sm.store_id = :storeId)
        GROUP BY CAST(sm.created_at AS date)
        ORDER BY day
        """, nativeQuery = true)
    List<Object[]> dailyStockMovementAggregates(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT sm FROM StockMovement sm
        JOIN FETCH sm.product
        LEFT JOIN FETCH sm.store
        LEFT JOIN FETCH sm.createdBy
        WHERE sm.movementType = 'WRITE_OFF'
          AND sm.createdAt >= :start AND sm.createdAt < :end
          AND (:storeId IS NULL OR sm.store.id = :storeId)
        ORDER BY sm.createdAt DESC
        """)
    org.springframework.data.domain.Page<StockMovement> findWriteOffsBetween(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("storeId") Integer storeId,
        org.springframework.data.domain.Pageable pageable
    );

    @Query(value = """
        SELECT COALESCE(SUM(sm.quantity * p.cost_price), 0)
        FROM stock_movements sm
        INNER JOIN products p ON p.id = sm.product_id
        WHERE sm.movement_type = 'RESTOCK' AND sm.quantity > 0
          AND sm.created_at >= :start AND sm.created_at < :end
          AND (:storeId IS NULL OR sm.store_id = :storeId)
        """, nativeQuery = true)
    java.math.BigDecimal sumRestockCostBetween(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("storeId") Integer storeId
    );

    @Query(value = """
        SELECT COALESCE(SUM((-sm.quantity) * p.cost_price), 0)
        FROM stock_movements sm
        INNER JOIN products p ON p.id = sm.product_id
        WHERE sm.movement_type = 'WRITE_OFF' AND sm.quantity < 0
          AND sm.created_at >= :start AND sm.created_at < :end
          AND (:storeId IS NULL OR sm.store_id = :storeId)
        """, nativeQuery = true)
    java.math.BigDecimal sumWriteOffCostBetween(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT sm.product.id AS productId,
               COALESCE(SUM(CASE WHEN sm.quantity < 0 THEN -sm.quantity ELSE 0 END), 0) AS dispatched
        FROM StockMovement sm
        WHERE sm.product.id IN :productIds
        GROUP BY sm.product.id
        """)
    List<ProductDispatchedSum> sumDispatchedByProductIds(@Param("productIds") Collection<UUID> productIds);

    @Query("""
        SELECT COALESCE(SUM(CASE WHEN sm.quantity < 0 THEN -sm.quantity ELSE 0 END), 0)
        FROM StockMovement sm
        WHERE sm.product.id = :productId
        """)
    long sumDispatchedByProductId(@Param("productId") UUID productId);

    @Query("""
        SELECT sm FROM StockMovement sm
        JOIN FETCH sm.product p
        LEFT JOIN FETCH sm.store
        LEFT JOIN FETCH sm.createdBy
        WHERE sm.createdAt >= :start AND sm.createdAt < :end
          AND (:movementType IS NULL OR sm.movementType = :movementType)
          AND (:storeId IS NULL OR sm.store.id = :storeId)
          AND (
            :search = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
          )
        ORDER BY sm.createdAt DESC
        """)
    org.springframework.data.domain.Page<StockMovement> findMovementJournal(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("movementType") String movementType,
        @Param("storeId") Integer storeId,
        @Param("search") String search,
        org.springframework.data.domain.Pageable pageable
    );
}
