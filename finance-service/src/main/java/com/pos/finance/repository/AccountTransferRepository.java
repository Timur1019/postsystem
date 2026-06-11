package com.pos.finance.repository;

import com.pos.finance.entity.AccountTransfer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface AccountTransferRepository extends JpaRepository<AccountTransfer, UUID> {

    @Query("""
        SELECT COALESCE(SUM(t.amount), 0) FROM AccountTransfer t
        WHERE t.companyId = :companyId
          AND t.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR t.storeId = :storeId)
        """)
    BigDecimal sumByPeriod(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT t FROM AccountTransfer t
        WHERE t.companyId = :companyId
          AND t.transactionDate >= COALESCE(:from, t.transactionDate)
          AND t.transactionDate <= COALESCE(:to, t.transactionDate)
          AND (:storeId IS NULL OR t.storeId = :storeId)
        ORDER BY t.transactionDate DESC, t.createdAt DESC
        """)
    Page<AccountTransfer> search(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        Pageable pageable
    );
}
