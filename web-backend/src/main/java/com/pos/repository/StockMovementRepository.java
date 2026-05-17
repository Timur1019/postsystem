package com.pos.repository;

import com.pos.entity.StockMovement;
import com.pos.repository.projection.ProductDispatchedSum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

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
}
