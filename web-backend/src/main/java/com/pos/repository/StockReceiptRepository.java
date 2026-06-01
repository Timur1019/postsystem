package com.pos.repository;

import com.pos.entity.StockReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface StockReceiptRepository extends JpaRepository<StockReceipt, UUID> {

    long countByCreatedAtGreaterThanEqual(Instant start);

    @Query("""
        SELECT r FROM StockReceipt r
        JOIN r.store st
        LEFT JOIN FETCH r.supplier
        LEFT JOIN FETCH r.store
        LEFT JOIN FETCH r.createdBy
        WHERE r.createdAt >= :start AND r.createdAt < :end
          AND (:storeId IS NULL OR r.store.id = :storeId)
          AND st.company.id = :companyId
        ORDER BY r.createdAt DESC
        """)
    Page<StockReceipt> findReceiptsBetween(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("storeId") Integer storeId,
        @Param("companyId") Integer companyId,
        Pageable pageable
    );

    @Query("""
        SELECT DISTINCT r FROM StockReceipt r
        LEFT JOIN FETCH r.lines l
        LEFT JOIN FETCH l.product
        LEFT JOIN FETCH r.supplier
        LEFT JOIN FETCH r.store
        LEFT JOIN FETCH r.createdBy
        WHERE r.id = :id
        """)
    Optional<StockReceipt> findDetailedById(@Param("id") UUID id);
}
