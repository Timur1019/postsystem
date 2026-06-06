package com.pos.repository.sale.impl;

import com.pos.entity.Sale;
import com.pos.repository.report.ReportQueryExecutor;
import com.pos.repository.sale.SaleAggregateRepository;
import com.pos.util.SqlLoader;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class SaleAggregateRepositoryImpl implements SaleAggregateRepository {

    private static final String DAILY_REVENUE_SQL = "sql/sales/daily-revenue-aggregates.sql";
    private static final String SALES_BY_STORE_SQL = "sql/sales/sales-by-store-between.sql";
    private static final String TOP_PRODUCTS_SQL = "sql/sales/top-products.sql";
    private static final String CASHIER_PERFORMANCE_SQL = "sql/sales/cashier-performance.sql";
    private static final String DAILY_ITEMS_SOLD_SQL = "sql/sales/daily-items-sold.sql";
    private static final String DAILY_SOLD_UNITS_SQL = "sql/sales/daily-sold-units.sql";
    private static final String SUM_COST_ESTIMATE_SQL = "sql/sales/sum-cost-estimate.sql";
    private static final String DAILY_COST_ESTIMATE_SQL = "sql/sales/daily-cost-estimate.sql";
    private static final String SOLD_UNITS_BY_PRODUCT_STORE_SQL = "sql/sales/sold-units-by-product-store.sql";

    private static final String SUM_TOTAL_JPQL = """
        SELECT COALESCE(SUM(s.totalAmount), 0)
        FROM Sale s
        WHERE s.createdAt >= :start AND s.createdAt < :end AND s.status = :status
        AND (:storeId IS NULL OR s.store.id = :storeId)
        AND (
            :companyId IS NULL
            OR (s.company IS NOT NULL AND s.company.id = :companyId)
            OR (s.company IS NULL AND s.store IS NOT NULL AND s.store.company.id = :companyId)
        )
        """;

    private static final String COUNT_SALES_JPQL = """
        SELECT COUNT(s) FROM Sale s
        WHERE s.createdAt >= :start AND s.createdAt < :end AND s.status = :status
        AND (:storeId IS NULL OR s.store.id = :storeId)
        AND (
            :companyId IS NULL
            OR (s.company IS NOT NULL AND s.company.id = :companyId)
            OR (s.company IS NULL AND s.store IS NOT NULL AND s.store.company.id = :companyId)
        )
        """;

    private static final String AGGREGATE_RETURNS_JPQL = """
        SELECT COUNT(s), COALESCE(SUM(s.totalAmount), 0)
        FROM Sale s
        WHERE s.createdAt >= :start AND s.createdAt < :end
          AND s.status IN :statuses
          AND (:companyId IS NULL OR s.company.id = :companyId)
        """;

    private static final String SUM_QUANTITY_SOLD_JPQL = """
        SELECT COALESCE(SUM(si.quantity), 0)
        FROM SaleItem si
        JOIN si.sale s
        WHERE s.createdAt >= :start AND s.createdAt < :end AND s.status = :status
        AND (:storeId IS NULL OR s.store.id = :storeId)
        AND (
            :companyId IS NULL
            OR (s.company IS NOT NULL AND s.company.id = :companyId)
            OR (s.company IS NULL AND s.store IS NOT NULL AND s.store.company.id = :companyId)
        )
        """;

    private static final String SUM_NET_QUANTITY_SOLD_JPQL = """
        SELECT COALESCE(SUM(si.quantity - si.returnedQuantity), 0)
        FROM SaleItem si
        JOIN si.sale s
        WHERE s.createdAt >= :start AND s.createdAt < :end AND s.status = :status
        AND (:storeId IS NULL OR s.store.id = :storeId)
        AND (
            :companyId IS NULL
            OR (s.company IS NOT NULL AND s.company.id = :companyId)
            OR (s.company IS NULL AND s.store IS NOT NULL AND s.store.company.id = :companyId)
        )
        """;

    private final ReportQueryExecutor reportQueryExecutor;
    private final EntityManager entityManager;
    private final SqlLoader sqlLoader;

    @Override
    public BigDecimal sumTotalBetween(
        Instant start,
        Instant end,
        Sale.SaleStatus status,
        Integer storeId,
        Integer companyId
    ) {
        return entityManager.createQuery(SUM_TOTAL_JPQL, BigDecimal.class)
            .setParameter("start", start)
            .setParameter("end", end)
            .setParameter("status", status)
            .setParameter("storeId", storeId)
            .setParameter("companyId", companyId)
            .getSingleResult();
    }

    @Override
    public long countSalesBetween(
        Instant start,
        Instant end,
        Sale.SaleStatus status,
        Integer storeId,
        Integer companyId
    ) {
        Long count = entityManager.createQuery(COUNT_SALES_JPQL, Long.class)
            .setParameter("start", start)
            .setParameter("end", end)
            .setParameter("status", status)
            .setParameter("storeId", storeId)
            .setParameter("companyId", companyId)
            .getSingleResult();
        return count != null ? count : 0L;
    }

    @Override
    public List<Object[]> aggregateReturnsBetween(
        Instant start,
        Instant end,
        List<Sale.SaleStatus> statuses,
        Integer companyId
    ) {
        TypedQuery<Object[]> query = entityManager.createQuery(AGGREGATE_RETURNS_JPQL, Object[].class);
        query.setParameter("start", start);
        query.setParameter("end", end);
        query.setParameter("statuses", statuses);
        query.setParameter("companyId", companyId);
        return query.getResultList();
    }

    @Override
    public List<Object[]> dailyRevenueAggregates(Instant start, Instant end, Integer companyId) {
        return reportQueryExecutor.fetchList(DAILY_REVENUE_SQL, query -> {
            query.setParameter("start", start);
            query.setParameter("end", end);
            query.setParameter("companyId", companyId);
        });
    }

    @Override
    public List<Object[]> salesByStoreBetween(Instant start, Instant end, Integer companyId) {
        return reportQueryExecutor.fetchList(SALES_BY_STORE_SQL, query -> {
            query.setParameter("start", start);
            query.setParameter("end", end);
            query.setParameter("companyId", companyId);
        });
    }

    @Override
    public long sumQuantitySoldBetween(
        Instant start,
        Instant end,
        Sale.SaleStatus status,
        Integer storeId,
        Integer companyId
    ) {
        BigDecimal sum = entityManager.createQuery(SUM_QUANTITY_SOLD_JPQL, BigDecimal.class)
            .setParameter("start", start)
            .setParameter("end", end)
            .setParameter("status", status)
            .setParameter("storeId", storeId)
            .setParameter("companyId", companyId)
            .getSingleResult();
        return sum != null ? sum.longValue() : 0L;
    }

    @Override
    public long sumNetQuantitySoldBetween(
        Instant start,
        Instant end,
        Sale.SaleStatus status,
        Integer storeId,
        Integer companyId
    ) {
        BigDecimal sum = entityManager.createQuery(SUM_NET_QUANTITY_SOLD_JPQL, BigDecimal.class)
            .setParameter("start", start)
            .setParameter("end", end)
            .setParameter("status", status)
            .setParameter("storeId", storeId)
            .setParameter("companyId", companyId)
            .getSingleResult();
        return sum != null ? sum.longValue() : 0L;
    }

    @Override
    public BigDecimal sumCostEstimateBetween(Instant start, Instant end, Integer storeId, Integer companyId) {
        Object result = entityManager.createNativeQuery(sqlLoader.load(SUM_COST_ESTIMATE_SQL))
            .setParameter("start", start)
            .setParameter("end", end)
            .setParameter("storeId", storeId)
            .setParameter("companyId", companyId)
            .getSingleResult();
        if (result == null) {
            return BigDecimal.ZERO;
        }
        if (result instanceof BigDecimal bd) {
            return bd;
        }
        return new BigDecimal(result.toString());
    }

    @Override
    public List<Object[]> topProductsRaw(LocalDate from, LocalDate to, int limit, Integer companyId) {
        return reportQueryExecutor.fetchList(TOP_PRODUCTS_SQL, query -> {
            query.setParameter("fromDate", from);
            query.setParameter("toDate", to);
            query.setParameter("limit", limit);
            query.setParameter("companyId", companyId);
        });
    }

    @Override
    public List<Object[]> cashierPerformanceRaw(LocalDate from, LocalDate to, Integer companyId) {
        return reportQueryExecutor.fetchList(CASHIER_PERFORMANCE_SQL, query -> {
            query.setParameter("fromDate", from);
            query.setParameter("toDate", to);
            query.setParameter("companyId", companyId);
        });
    }

    @Override
    public List<Object[]> dailyItemsSoldAggregates(Instant start, Instant end, Integer companyId) {
        return reportQueryExecutor.fetchList(DAILY_ITEMS_SOLD_SQL, query -> {
            query.setParameter("start", start);
            query.setParameter("end", end);
            query.setParameter("companyId", companyId);
        });
    }

    @Override
    public List<Object[]> dailySoldUnitsAggregates(Instant start, Instant end, Integer storeId, Integer companyId) {
        return reportQueryExecutor.fetchList(DAILY_SOLD_UNITS_SQL, query -> {
            query.setParameter("start", start);
            query.setParameter("end", end);
            query.setParameter("storeId", storeId);
            query.setParameter("companyId", companyId);
        });
    }

    @Override
    public List<Object[]> dailyCostEstimateAggregates(Instant start, Instant end, Integer companyId) {
        return reportQueryExecutor.fetchList(DAILY_COST_ESTIMATE_SQL, query -> {
            query.setParameter("start", start);
            query.setParameter("end", end);
            query.setParameter("companyId", companyId);
        });
    }

    @Override
    public List<Object[]> soldUnitsByProductAndStore(Instant start, Instant end, Integer companyId) {
        return reportQueryExecutor.fetchList(SOLD_UNITS_BY_PRODUCT_STORE_SQL, query -> {
            query.setParameter("start", start);
            query.setParameter("end", end);
            query.setParameter("companyId", companyId);
        });
    }
}
