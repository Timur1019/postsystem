package com.pos.repository.sale.impl;

import com.pos.entity.Sale;
import com.pos.repository.sale.SaleSearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class SaleSearchRepositoryImpl implements SaleSearchRepository {

    private static final String SEARCH_SALES_JPQL = """
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
        AND (
            :companyId IS NULL
            OR (s.company IS NOT NULL AND s.company.id = :companyId)
            OR (s.company IS NULL AND s.store IS NOT NULL AND s.store.company.id = :companyId)
        )
        """;

    private static final String SEARCH_SALES_COUNT_JPQL = """
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
        AND (
            :companyId IS NULL
            OR (s.company IS NOT NULL AND s.company.id = :companyId)
            OR (s.company IS NULL AND s.store IS NOT NULL AND s.store.company.id = :companyId)
        )
        """;

    private static final String SEARCH_RETURNS_JPQL = """
        SELECT s FROM Sale s
        LEFT JOIN FETCH s.store
        LEFT JOIN FETCH s.cashier
        WHERE s.status IN :returnStatuses
        AND s.createdAt >= :start AND s.createdAt < :end
        AND (:cashierName IS NULL OR :cashierName = '' OR LOWER(s.cashier.fullName) LIKE LOWER(CONCAT('%', :cashierName, '%')))
        AND (:fiscal IS NULL OR :fiscal = '' OR LOWER(s.receiptNumber) LIKE LOWER(CONCAT('%', :fiscal, '%')))
        AND (:storeId IS NULL OR (s.store IS NOT NULL AND s.store.id = :storeId))
        AND (
            :companyId IS NULL
            OR (s.company IS NOT NULL AND s.company.id = :companyId)
            OR (s.company IS NULL AND s.store IS NOT NULL AND s.store.company.id = :companyId)
        )
        """;

    private static final String SEARCH_RETURNS_COUNT_JPQL = """
        SELECT COUNT(s) FROM Sale s
        WHERE s.status IN :returnStatuses
        AND s.createdAt >= :start AND s.createdAt < :end
        AND (:cashierName IS NULL OR :cashierName = '' OR LOWER(s.cashier.fullName) LIKE LOWER(CONCAT('%', :cashierName, '%')))
        AND (:fiscal IS NULL OR :fiscal = '' OR LOWER(s.receiptNumber) LIKE LOWER(CONCAT('%', :fiscal, '%')))
        AND (:storeId IS NULL OR (s.store IS NOT NULL AND s.store.id = :storeId))
        AND (
            :companyId IS NULL
            OR (s.company IS NOT NULL AND s.company.id = :companyId)
            OR (s.company IS NULL AND s.store IS NOT NULL AND s.store.company.id = :companyId)
        )
        """;

    private static final String CASHIER_BY_SHIFT_JPQL = """
        SELECT s FROM Sale s
        WHERE s.cashier.username = :username
        AND s.cashierShift.id = :shiftId
        ORDER BY s.createdAt DESC
        """;

    private static final String CASHIER_BY_SHIFT_COUNT_JPQL = """
        SELECT COUNT(s) FROM Sale s
        WHERE s.cashier.username = :username
        AND s.cashierShift.id = :shiftId
        """;

    private static final String CASHIER_EXCLUDING_SHIFT_JPQL = """
        SELECT s FROM Sale s
        WHERE s.cashier.username = :username
        AND (s.cashierShift IS NULL OR s.cashierShift.id <> :shiftId)
        ORDER BY s.createdAt DESC
        """;

    private static final String CASHIER_EXCLUDING_SHIFT_COUNT_JPQL = """
        SELECT COUNT(s) FROM Sale s
        WHERE s.cashier.username = :username
        AND (s.cashierShift IS NULL OR s.cashierShift.id <> :shiftId)
        """;

    private static final String SEARCH_CASHIER_SALES_JPQL = """
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
        """;

    private static final String SEARCH_CASHIER_SALES_COUNT_JPQL = """
        SELECT COUNT(s) FROM Sale s
        WHERE s.cashier.username = :username
        AND (:shiftId IS NULL OR s.cashierShift.id = :shiftId)
        AND (:excludeShiftId IS NULL OR s.cashierShift IS NULL OR s.cashierShift.id <> :excludeShiftId)
        AND (:receiptNumber IS NULL OR :receiptNumber = '' OR LOWER(s.receiptNumber) LIKE LOWER(CONCAT('%', :receiptNumber, '%')))
        AND (:paymentMethod IS NULL OR s.paymentMethod = :paymentMethod)
        AND (:status IS NULL OR s.status = :status)
        AND (:dateFrom IS NULL OR s.createdAt >= :dateFrom)
        AND (:dateTo IS NULL OR s.createdAt < :dateTo)
        """;

    private final SaleJpaQueryExecutor saleJpaQueryExecutor;

    @Override
    public Page<Sale> searchSales(
        Instant start,
        Instant end,
        UUID cashierId,
        String receipt,
        String cashierName,
        String q,
        Sale.PaymentMethod paymentMethod,
        Sale.SaleStatus status,
        UUID saleId,
        String paymentSettlement,
        Integer storeId,
        Integer companyId,
        Pageable pageable
    ) {
        return saleJpaQueryExecutor.fetchPage(
            SEARCH_SALES_JPQL,
            SEARCH_SALES_COUNT_JPQL,
            query -> bindSearchSalesParams(
                query, start, end, cashierId, receipt, cashierName, q,
                paymentMethod, status, saleId, paymentSettlement, storeId, companyId
            ),
            pageable,
            graph -> {
                graph.addAttributeNodes("cashier", "store", "cashierShift");
                graph.addSubgraph("cashierShift").addAttributeNodes("zReport");
            }
        );
    }

    @Override
    public Page<Sale> searchReturns(
        List<Sale.SaleStatus> returnStatuses,
        Instant start,
        Instant end,
        String cashierName,
        String fiscal,
        Integer storeId,
        Integer companyId,
        Pageable pageable
    ) {
        return saleJpaQueryExecutor.fetchPage(
            SEARCH_RETURNS_JPQL,
            SEARCH_RETURNS_COUNT_JPQL,
            query -> {
                query.setParameter("returnStatuses", returnStatuses);
                query.setParameter("start", start);
                query.setParameter("end", end);
                query.setParameter("cashierName", cashierName);
                query.setParameter("fiscal", fiscal);
                query.setParameter("storeId", storeId);
                query.setParameter("companyId", companyId);
            },
            pageable
        );
    }

    @Override
    public Page<Sale> findByCashierUsername(String username, Pageable pageable) {
        return searchCashierSales(username, null, null, null, null, null, null, null, pageable);
    }

    @Override
    public Page<Sale> findByCashierUsernameAndShiftId(String username, UUID shiftId, Pageable pageable) {
        return saleJpaQueryExecutor.fetchPage(
            CASHIER_BY_SHIFT_JPQL,
            CASHIER_BY_SHIFT_COUNT_JPQL,
            query -> {
                query.setParameter("username", username);
                query.setParameter("shiftId", shiftId);
            },
            pageable
        );
    }

    @Override
    public Page<Sale> findByCashierUsernameExcludingShiftId(String username, UUID shiftId, Pageable pageable) {
        return saleJpaQueryExecutor.fetchPage(
            CASHIER_EXCLUDING_SHIFT_JPQL,
            CASHIER_EXCLUDING_SHIFT_COUNT_JPQL,
            query -> {
                query.setParameter("username", username);
                query.setParameter("shiftId", shiftId);
            },
            pageable
        );
    }

    @Override
    public Page<Sale> searchCashierSales(
        String username,
        UUID shiftId,
        UUID excludeShiftId,
        String receiptNumber,
        Sale.PaymentMethod paymentMethod,
        Sale.SaleStatus status,
        Instant dateFrom,
        Instant dateTo,
        Pageable pageable
    ) {
        return saleJpaQueryExecutor.fetchPage(
            SEARCH_CASHIER_SALES_JPQL,
            SEARCH_CASHIER_SALES_COUNT_JPQL,
            query -> {
                query.setParameter("username", username);
                query.setParameter("shiftId", shiftId);
                query.setParameter("excludeShiftId", excludeShiftId);
                query.setParameter("receiptNumber", receiptNumber);
                query.setParameter("paymentMethod", paymentMethod);
                query.setParameter("status", status);
                query.setParameter("dateFrom", dateFrom);
                query.setParameter("dateTo", dateTo);
            },
            pageable
        );
    }

    private static void bindSearchSalesParams(
        jakarta.persistence.TypedQuery<?> query,
        Instant start,
        Instant end,
        UUID cashierId,
        String receipt,
        String cashierName,
        String q,
        Sale.PaymentMethod paymentMethod,
        Sale.SaleStatus status,
        UUID saleId,
        String paymentSettlement,
        Integer storeId,
        Integer companyId
    ) {
        query.setParameter("start", start);
        query.setParameter("end", end);
        query.setParameter("cashierId", cashierId);
        query.setParameter("receipt", receipt);
        query.setParameter("cashierName", cashierName);
        query.setParameter("q", q);
        query.setParameter("paymentMethod", paymentMethod);
        query.setParameter("status", status);
        query.setParameter("saleId", saleId);
        query.setParameter("paymentSettlement", paymentSettlement);
        query.setParameter("storeId", storeId);
        query.setParameter("companyId", companyId);
    }
}
