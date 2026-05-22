package com.pos.repository;

import com.pos.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SaleRepository extends JpaRepository<Sale, UUID>, JpaSpecificationExecutor<Sale> {

    Optional<Sale> findByReceiptNumber(String receiptNumber);

    long countByReceiptNumberStartingWith(String prefix);

    @EntityGraph(attributePaths = {"cashier", "store", "cashierShift", "cashierShift.zReport"})
    @Query(
        value = """
        SELECT s FROM Sale s
        WHERE s.createdAt >= :start AND s.createdAt < :end
        AND (COALESCE(:cashierId, s.cashier.id) = s.cashier.id)
        AND (:storeId IS NULL OR (s.store IS NOT NULL AND s.store.id = :storeId))
        AND (:receipt IS NULL OR :receipt = '' OR LOWER(s.receiptNumber) LIKE LOWER(CONCAT('%', :receipt, '%')))
        AND (:cashierName IS NULL OR :cashierName = '' OR LOWER(s.cashier.fullName) LIKE LOWER(CONCAT('%', :cashierName, '%')))
        AND (:q IS NULL OR :q = '' OR (
            LOWER(s.receiptNumber) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(s.cashier.fullName) LIKE LOWER(CONCAT('%', :q, '%'))
        ))
        AND (COALESCE(:paymentMethod, s.paymentMethod) = s.paymentMethod)
        AND (COALESCE(:status, s.status) = s.status)
        AND (COALESCE(:saleId, s.id) = s.id)
        AND (
            :paymentSettlement IS NULL OR :paymentSettlement = '' OR :paymentSettlement = 'ALL'
            OR (:paymentSettlement = 'FULL' AND (s.receiptType IS NULL OR s.receiptType = 'SALE'))
            OR (:paymentSettlement = 'ADVANCE' AND s.receiptType = 'ADVANCE')
            OR (:paymentSettlement = 'CREDIT' AND s.receiptType = 'CREDIT')
        )
        """,
        countQuery = """
        SELECT COUNT(s) FROM Sale s
        WHERE s.createdAt >= :start AND s.createdAt < :end
        AND (COALESCE(:cashierId, s.cashier.id) = s.cashier.id)
        AND (:receipt IS NULL OR :receipt = '' OR LOWER(s.receiptNumber) LIKE LOWER(CONCAT('%', :receipt, '%')))
        AND (:cashierName IS NULL OR :cashierName = '' OR LOWER(s.cashier.fullName) LIKE LOWER(CONCAT('%', :cashierName, '%')))
        AND (:q IS NULL OR :q = '' OR (
            LOWER(s.receiptNumber) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(s.cashier.fullName) LIKE LOWER(CONCAT('%', :q, '%'))
        ))
        AND (COALESCE(:paymentMethod, s.paymentMethod) = s.paymentMethod)
        AND (COALESCE(:status, s.status) = s.status)
        AND (COALESCE(:saleId, s.id) = s.id)
        AND (
            :paymentSettlement IS NULL OR :paymentSettlement = '' OR :paymentSettlement = 'ALL'
            OR (:paymentSettlement = 'FULL' AND (s.receiptType IS NULL OR s.receiptType = 'SALE'))
            OR (:paymentSettlement = 'ADVANCE' AND s.receiptType = 'ADVANCE')
            OR (:paymentSettlement = 'CREDIT' AND s.receiptType = 'CREDIT')
        )
        AND (:storeId IS NULL OR (s.store IS NOT NULL AND s.store.id = :storeId))
        """)
    Page<Sale> searchSales(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("cashierId") UUID cashierId,
        @Param("receipt") String receipt,
        @Param("cashierName") String cashierName,
        @Param("q") String q,
        @Param("paymentMethod") Sale.PaymentMethod paymentMethod,
        @Param("status") Sale.SaleStatus status,
        @Param("saleId") UUID saleId,
        @Param("paymentSettlement") String paymentSettlement,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @Query(
        value = """
        SELECT s FROM Sale s
        LEFT JOIN FETCH s.store
        LEFT JOIN FETCH s.cashier
        WHERE s.status IN :returnStatuses
        AND s.createdAt >= :start AND s.createdAt < :end
        AND (:cashierName IS NULL OR :cashierName = '' OR LOWER(s.cashier.fullName) LIKE LOWER(CONCAT('%', :cashierName, '%')))
        AND (:fiscal IS NULL OR :fiscal = '' OR LOWER(s.receiptNumber) LIKE LOWER(CONCAT('%', :fiscal, '%')))
        AND (:storeId IS NULL OR (s.store IS NOT NULL AND s.store.id = :storeId))
        """,
        countQuery = """
        SELECT COUNT(s) FROM Sale s
        WHERE s.status IN :returnStatuses
        AND s.createdAt >= :start AND s.createdAt < :end
        AND (:cashierName IS NULL OR :cashierName = '' OR LOWER(s.cashier.fullName) LIKE LOWER(CONCAT('%', :cashierName, '%')))
        AND (:fiscal IS NULL OR :fiscal = '' OR LOWER(s.receiptNumber) LIKE LOWER(CONCAT('%', :fiscal, '%')))
        AND (:storeId IS NULL OR (s.store IS NOT NULL AND s.store.id = :storeId))
        """
    )
    Page<Sale> searchReturns(
        @Param("returnStatuses") List<Sale.SaleStatus> returnStatuses,
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("cashierName") String cashierName,
        @Param("fiscal") String fiscal,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    Page<Sale> findByCashier_Username(String username, Pageable pageable);

    @Query("""
        SELECT s FROM Sale s
        WHERE s.cashier.username = :username
        AND s.cashierShift.id = :shiftId
        ORDER BY s.createdAt DESC
        """)
    Page<Sale> findByCashierUsernameAndShiftId(
        @Param("username") String username,
        @Param("shiftId") UUID shiftId,
        Pageable pageable
    );

    @Query("""
        SELECT s FROM Sale s
        WHERE s.cashier.username = :username
        AND (s.cashierShift IS NULL OR s.cashierShift.id <> :shiftId)
        ORDER BY s.createdAt DESC
        """)
    Page<Sale> findByCashierUsernameExcludingShiftId(
        @Param("username") String username,
        @Param("shiftId") UUID shiftId,
        Pageable pageable
    );

    @Query("""
        SELECT s FROM Sale s
        WHERE s.cashier.username = :username
        AND (:shiftId IS NULL OR s.cashierShift.id = :shiftId)
        AND (:excludeShiftId IS NULL OR s.cashierShift IS NULL OR s.cashierShift.id <> :excludeShiftId)
        AND (:receiptNumber IS NULL OR :receiptNumber = '' OR LOWER(s.receiptNumber) LIKE LOWER(CONCAT('%', :receiptNumber, '%')))
        AND (:paymentMethod IS NULL OR s.paymentMethod = :paymentMethod)
        AND (:status IS NULL OR s.status = :status)
        AND (:dateFrom IS NULL OR s.createdAt >= :dateFrom)
        AND (:dateTo IS NULL OR s.createdAt < :dateTo)
        ORDER BY s.createdAt DESC
        """)
    Page<Sale> searchCashierSales(
        @Param("username") String username,
        @Param("shiftId") UUID shiftId,
        @Param("excludeShiftId") UUID excludeShiftId,
        @Param("receiptNumber") String receiptNumber,
        @Param("paymentMethod") Sale.PaymentMethod paymentMethod,
        @Param("status") Sale.SaleStatus status,
        @Param("dateFrom") java.time.Instant dateFrom,
        @Param("dateTo") java.time.Instant dateTo,
        Pageable pageable
    );

    @Query("""
        SELECT COALESCE(SUM(s.totalAmount), 0)
        FROM Sale s
        WHERE s.createdAt >= :start AND s.createdAt < :end AND s.status = :status
        AND (:storeId IS NULL OR s.store.id = :storeId)
        """)
    BigDecimal sumTotalBetween(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("status") Sale.SaleStatus status,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT COUNT(s) FROM Sale s
        WHERE s.createdAt >= :start AND s.createdAt < :end AND s.status = :status
        AND (:storeId IS NULL OR s.store.id = :storeId)
        """)
    long countSalesBetween(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("status") Sale.SaleStatus status,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT DISTINCT s FROM Sale s
        JOIN FETCH s.cashier
        LEFT JOIN FETCH s.items i
        LEFT JOIN FETCH i.product
        WHERE s.createdAt >= :from AND s.createdAt <= :to AND s.status = :st
        ORDER BY s.createdAt ASC
        """)
    List<Sale> findCompletedForExportBetween(
        @Param("from") Instant from,
        @Param("to") Instant to,
        @Param("st") Sale.SaleStatus st
    );

    @Query("""
        SELECT DISTINCT s FROM Sale s
        JOIN FETCH s.cashier
        LEFT JOIN FETCH s.store
        LEFT JOIN FETCH s.customer
        LEFT JOIN FETCH s.cashierShift sh
        LEFT JOIN FETCH sh.zReport
        LEFT JOIN FETCH s.items
        WHERE s.createdAt >= :start AND s.createdAt < :end
        ORDER BY s.createdAt DESC
        """)
    List<Sale> findSummariesForLedgerBetween(
        @Param("start") Instant start,
        @Param("end") Instant end
    );

    @Query(value = """
        SELECT CAST(s.created_at AS date) AS day,
               COALESCE(SUM(s.total_amount), 0) AS revenue,
               COUNT(*) AS tx_count
        FROM sales s
        WHERE s.created_at >= :start AND s.created_at < :end
          AND s.status = 'COMPLETED'
        GROUP BY CAST(s.created_at AS date)
        ORDER BY day
        """, nativeQuery = true)
    List<Object[]> dailyRevenueAggregates(
        @Param("start") Instant start,
        @Param("end") Instant end
    );

    @Query(value = """
        SELECT COUNT(*),
               COALESCE(SUM(total_amount), 0),
               COALESCE(SUM(tax_total), 0),
               COALESCE(SUM(discount_total), 0),
               COALESCE(SUM(cash_amount), 0),
               COALESCE(SUM(card_amount), 0)
        FROM sales
        WHERE cashier_id = :cashierId
          AND store_id = :storeId
          AND status = 'COMPLETED'
          AND created_at >= :from
          AND created_at < :to
        """, nativeQuery = true)
    List<Object[]> aggregateShiftSales(
        @Param("cashierId") UUID cashierId,
        @Param("storeId") Integer storeId,
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    @Query(value = """
        SELECT COUNT(*),
               COALESCE(SUM(total_amount), 0),
               COALESCE(SUM(tax_total), 0),
               COALESCE(SUM(discount_total), 0),
               COALESCE(SUM(cash_amount), 0),
               COALESCE(SUM(card_amount), 0),
               MIN(receipt_number),
               MAX(receipt_number)
        FROM sales
        WHERE cashier_shift_id = :shiftId
          AND status = 'COMPLETED'
        """, nativeQuery = true)
    List<Object[]> aggregateByShiftId(@Param("shiftId") UUID shiftId);

    /**
     * Статистика смены для баннера и Z-отчёта: число чеков (все статусы) и чистая выручка
     * (COMPLETED + остаток по REFUNDED после частичных возвратов; VOIDED не входят в сумму).
     */
    @Query(value = """
        SELECT CAST(COUNT(*) AS INTEGER),
               COALESCE(SUM(
                   CASE s.status
                       WHEN 'COMPLETED' THEN s.total_amount
                       WHEN 'VOIDED' THEN 0
                       WHEN 'REFUNDED' THEN GREATEST(
                           0,
                           s.total_amount - COALESCE((
                               SELECT SUM(
                                   CASE
                                       WHEN si.quantity <= 0 THEN 0
                                       WHEN si.returned_quantity >= si.quantity THEN si.line_total
                                       ELSE ROUND(
                                           si.line_total * CAST(si.returned_quantity AS DECIMAL) / si.quantity,
                                           2
                                       )
                                   END
                               )
                               FROM sale_items si
                               WHERE si.sale_id = s.id
                           ), 0)
                       )
                       ELSE 0
                   END
               ), 0),
               COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.tax_total ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.discount_total ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.cash_amount ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.card_amount ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.line_discount_total ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.order_discount_amount ELSE 0 END), 0)
        FROM sales s
        WHERE s.cashier_shift_id = :shiftId
        """, nativeQuery = true)
    List<Object[]> aggregateShiftBannerByShiftId(@Param("shiftId") UUID shiftId);

    @Query(value = """
        SELECT CAST(COUNT(*) AS INTEGER),
               COALESCE(SUM(
                   CASE s.status
                       WHEN 'COMPLETED' THEN s.total_amount
                       WHEN 'VOIDED' THEN 0
                       WHEN 'REFUNDED' THEN GREATEST(
                           0,
                           s.total_amount - COALESCE((
                               SELECT SUM(
                                   CASE
                                       WHEN si.quantity <= 0 THEN 0
                                       WHEN si.returned_quantity >= si.quantity THEN si.line_total
                                       ELSE ROUND(
                                           si.line_total * CAST(si.returned_quantity AS DECIMAL) / si.quantity,
                                           2
                                       )
                                   END
                               )
                               FROM sale_items si
                               WHERE si.sale_id = s.id
                           ), 0)
                       )
                       ELSE 0
                   END
               ), 0),
               COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.tax_total ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.discount_total ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.cash_amount ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.card_amount ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.line_discount_total ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.order_discount_amount ELSE 0 END), 0)
        FROM sales s
        WHERE s.cashier_id = :cashierId
          AND s.store_id = :storeId
          AND s.created_at >= :from
          AND s.created_at < :to
        """, nativeQuery = true)
    List<Object[]> aggregateShiftBannerByCashierAndTime(
        @Param("cashierId") UUID cashierId,
        @Param("storeId") Integer storeId,
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    @Query(value = """
        SELECT COUNT(*),
               COALESCE(SUM(tax_total), 0),
               COALESCE(SUM(cash_amount), 0),
               COALESCE(SUM(card_amount), 0)
        FROM sales
        WHERE cashier_shift_id = :shiftId
          AND status IN ('REFUNDED', 'VOIDED')
        """, nativeQuery = true)
    List<Object[]> aggregateReturnsByShiftId(@Param("shiftId") UUID shiftId);

    @Query("""
        SELECT DISTINCT s FROM Sale s
        JOIN FETCH s.cashier
        LEFT JOIN FETCH s.items i
        LEFT JOIN FETCH i.product
        WHERE s.cashierShift.zReport.id = :zReportId
          AND s.status = :status
        ORDER BY s.createdAt ASC
        """)
    List<Sale> findCompletedForZReport(
        @Param("zReportId") Long zReportId,
        @Param("status") Sale.SaleStatus status
    );

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
