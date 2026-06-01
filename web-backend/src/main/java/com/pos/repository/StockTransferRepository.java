package com.pos.repository;

import com.pos.entity.StockTransfer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface StockTransferRepository extends JpaRepository<StockTransfer, UUID> {

    long countByCreatedAtGreaterThanEqual(Instant dayStart);

    @EntityGraph(attributePaths = {"fromStore", "toStore", "createdBy", "lines", "lines.product"})
    @Query("SELECT t FROM StockTransfer t WHERE t.id = :id")
    Optional<StockTransfer> findDetailedById(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"fromStore", "toStore", "createdBy"})
    @Query("""
        SELECT t FROM StockTransfer t
        WHERE t.fromStore.company.id = :companyId
          AND t.toStore.company.id = :companyId
          AND t.createdAt >= :start AND t.createdAt < :end
          AND (:fromStoreId IS NULL OR t.fromStore.id = :fromStoreId)
          AND (:toStoreId IS NULL OR t.toStore.id = :toStoreId)
        ORDER BY t.createdAt DESC
        """)
    Page<StockTransfer> findBetween(
        @Param("companyId") Integer companyId,
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("fromStoreId") Integer fromStoreId,
        @Param("toStoreId") Integer toStoreId,
        Pageable pageable
    );
}
