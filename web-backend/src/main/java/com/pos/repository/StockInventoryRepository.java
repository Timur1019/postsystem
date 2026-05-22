package com.pos.repository;

import com.pos.entity.StockInventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface StockInventoryRepository extends JpaRepository<StockInventory, UUID> {

    long countByCreatedAtGreaterThanEqual(Instant dayStart);

    @EntityGraph(attributePaths = {"store", "createdBy", "lines", "lines.product"})
    @Query("SELECT i FROM StockInventory i WHERE i.id = :id")
    Optional<StockInventory> findDetailedById(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"store", "createdBy"})
    @Query("""
        SELECT i FROM StockInventory i
        WHERE i.createdAt >= :start AND i.createdAt < :end
        AND (:storeId IS NULL OR i.store.id = :storeId)
        ORDER BY i.createdAt DESC
        """)
    Page<StockInventory> findBetween(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );
}
