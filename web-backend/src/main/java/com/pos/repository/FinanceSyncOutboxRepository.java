package com.pos.repository;

import com.pos.entity.FinanceSyncOutbox;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FinanceSyncOutboxRepository extends JpaRepository<FinanceSyncOutbox, UUID> {

    Optional<FinanceSyncOutbox> findByIdempotencyKey(String idempotencyKey);

    @Query("""
        SELECT o FROM FinanceSyncOutbox o
        WHERE o.status IN :statuses
          AND (o.nextRetryAt IS NULL OR o.nextRetryAt <= :now)
        ORDER BY o.createdAt ASC
        """)
    List<FinanceSyncOutbox> findReadyForRetry(
        @Param("statuses") List<String> statuses,
        @Param("now") Instant now,
        Pageable pageable
    );

    Page<FinanceSyncOutbox> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<FinanceSyncOutbox> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
}
