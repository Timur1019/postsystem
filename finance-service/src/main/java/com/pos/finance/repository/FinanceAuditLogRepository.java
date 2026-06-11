package com.pos.finance.repository;

import com.pos.finance.entity.FinanceAuditEntityType;
import com.pos.finance.entity.FinanceAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface FinanceAuditLogRepository extends JpaRepository<FinanceAuditLog, UUID> {

    @Query("""
        SELECT a FROM FinanceAuditLog a
        WHERE a.companyId = :companyId
          AND a.entityType = COALESCE(:entityType, a.entityType)
          AND a.createdAt >= COALESCE(:from, a.createdAt)
          AND a.createdAt <= COALESCE(:to, a.createdAt)
        ORDER BY a.createdAt DESC
        """)
    Page<FinanceAuditLog> search(
        @Param("companyId") Integer companyId,
        @Param("entityType") FinanceAuditEntityType entityType,
        @Param("from") Instant from,
        @Param("to") Instant to,
        Pageable pageable
    );
}
