package com.pos.repository;

import com.pos.entity.Sale;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SaleRepository extends JpaRepository<Sale, UUID>, JpaSpecificationExecutor<Sale> {

    Optional<Sale> findByReceiptNumber(String receiptNumber);

    long countByReceiptNumberStartingWith(String prefix);

    long countByStore_Id(Integer storeId);

    @EntityGraph(attributePaths = {"cashier", "store", "items", "items.product"})
    @Query("""
        SELECT DISTINCT s FROM Sale s
        JOIN s.items si
        WHERE si.product.id = :productId
          AND s.createdAt >= :start AND s.createdAt < :end
        ORDER BY s.createdAt ASC
        """)
    List<Sale> findSalesWithProductBetween(
        @Param("productId") UUID productId,
        @Param("start") Instant start,
        @Param("end") Instant end
    );
}
