package com.pos.finance.repository;

import com.pos.finance.entity.Income;
import com.pos.finance.entity.IncomeSourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IncomeRepository extends JpaRepository<Income, UUID> {

    Optional<Income> findByCompanyIdAndSourceTypeAndSourceIdAndDeletedFalse(
        Integer companyId, IncomeSourceType sourceType, String sourceId
    );

    Optional<Income> findByIdAndCompanyIdAndDeletedFalse(UUID id, Integer companyId);

    @Query("""
        SELECT i FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND (:storeId IS NULL OR i.storeId = :storeId)
          AND i.transactionDate >= COALESCE(:from, i.transactionDate)
          AND i.transactionDate <= COALESCE(:to, i.transactionDate)
          AND i.paymentMethod = COALESCE(:paymentMethod, i.paymentMethod)
        ORDER BY i.transactionDate DESC, i.createdAt DESC
        """)
    Page<Income> search(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("paymentMethod") com.pos.finance.entity.PaymentMethod paymentMethod,
        Pageable pageable
    );

    @Query("""
        SELECT COALESCE(SUM(i.amount), 0) FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        """)
    BigDecimal sumByPeriod(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT COALESCE(SUM(i.amount), 0) FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.sourceType = :sourceType
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        """)
    BigDecimal sumBySourceAndPeriod(
        @Param("companyId") Integer companyId,
        @Param("sourceType") IncomeSourceType sourceType,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT COUNT(i) FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.sourceType = :sourceType
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        """)
    long countBySourceAndPeriod(
        @Param("companyId") Integer companyId,
        @Param("sourceType") IncomeSourceType sourceType,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT i FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND (:storeId IS NULL OR i.storeId = :storeId)
        ORDER BY i.transactionDate DESC, i.createdAt DESC
        """)
    List<Income> findRecent(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @Query("""
        SELECT i FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        ORDER BY i.transactionDate DESC, i.createdAt DESC
        """)
    List<Income> findRecentInPeriod(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @Query("""
        SELECT i.transactionDate, COALESCE(SUM(i.amount), 0)
        FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        GROUP BY i.transactionDate
        ORDER BY i.transactionDate
        """)
    List<Object[]> sumDailyByPeriod(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );
}
