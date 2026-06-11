package com.pos.finance.repository;

import com.pos.finance.entity.Expense;
import com.pos.finance.entity.ExpenseSourceType;
import com.pos.finance.entity.PaymentMethod;
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

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    Optional<Expense> findByCompanyIdAndSourceTypeAndSourceIdAndDeletedFalse(
        Integer companyId, ExpenseSourceType sourceType, String sourceId
    );

    boolean existsByCompanyIdAndSourceTypeAndSourceIdAndDeletedFalse(
        Integer companyId, ExpenseSourceType sourceType, String sourceId
    );

    Optional<Expense> findByIdAndCompanyIdAndDeletedFalse(UUID id, Integer companyId);

    @Query("""
        SELECT COALESCE(SUM(e.amount), 0) FROM Expense e
        WHERE e.companyId = :companyId AND e.deleted = false
          AND e.sourceType = :sourceType
          AND e.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR e.storeId = :storeId)
        """)
    BigDecimal sumBySourceAndPeriod(
        @Param("companyId") Integer companyId,
        @Param("sourceType") ExpenseSourceType sourceType,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT e FROM Expense e
        WHERE e.companyId = :companyId AND e.deleted = false
          AND (:storeId IS NULL OR e.storeId = :storeId)
          AND e.transactionDate >= COALESCE(:from, e.transactionDate)
          AND e.transactionDate <= COALESCE(:to, e.transactionDate)
          AND e.expenseCategory.id = COALESCE(:categoryId, e.expenseCategory.id)
          AND e.paymentMethod = COALESCE(:paymentMethod, e.paymentMethod)
        ORDER BY e.transactionDate DESC, e.createdAt DESC
        """)
    Page<Expense> search(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("categoryId") UUID categoryId,
        @Param("paymentMethod") PaymentMethod paymentMethod,
        Pageable pageable
    );

    @Query("""
        SELECT COALESCE(SUM(e.amount), 0) FROM Expense e
        WHERE e.companyId = :companyId AND e.deleted = false
          AND e.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR e.storeId = :storeId)
        """)
    BigDecimal sumByPeriod(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT e.expenseCategory.name, COALESCE(SUM(e.amount), 0)
        FROM Expense e
        WHERE e.companyId = :companyId AND e.deleted = false
          AND e.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR e.storeId = :storeId)
        GROUP BY e.expenseCategory.name
        ORDER BY SUM(e.amount) DESC
        """)
    List<Object[]> sumByCategory(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT e FROM Expense e
        WHERE e.companyId = :companyId AND e.deleted = false
          AND (:storeId IS NULL OR e.storeId = :storeId)
        ORDER BY e.transactionDate DESC, e.createdAt DESC
        """)
    List<Expense> findRecent(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @Query("""
        SELECT e FROM Expense e
        WHERE e.companyId = :companyId AND e.deleted = false
          AND e.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR e.storeId = :storeId)
        ORDER BY e.transactionDate DESC, e.createdAt DESC
        """)
    List<Expense> findRecentInPeriod(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @Query("""
        SELECT e.transactionDate, COALESCE(SUM(e.amount), 0)
        FROM Expense e
        WHERE e.companyId = :companyId AND e.deleted = false
          AND e.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR e.storeId = :storeId)
        GROUP BY e.transactionDate
        ORDER BY e.transactionDate
        """)
    List<Object[]> sumDailyByPeriod(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );
}
