package com.pos.repository.report.impl;

import com.pos.entity.Product;
import com.pos.entity.StockMovement;
import com.pos.repository.report.ReportQueryExecutor;
import com.pos.repository.report.StockReportRepository;
import com.pos.repository.stock.impl.StockMovementJpaQueryExecutor;
import com.pos.util.SqlLoader;
import jakarta.persistence.EntityGraph;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class StockReportRepositoryImpl implements StockReportRepository {

    private static final String STOCK_TURNOVER_SQL = "sql/reports/stock-turnover.sql";
    private static final String STOCK_TURNOVER_COUNT_SQL = "sql/reports/stock-turnover-count.sql";
    private static final String DEAD_STOCK_SQL = "sql/reports/dead-stock.sql";
    private static final String DEAD_STOCK_COUNT_SQL = "sql/reports/dead-stock-count.sql";
    private static final String DAILY_STOCK_MOVEMENT_SQL = "sql/stock/daily-stock-movement-aggregates.sql";
    private static final String SUM_RESTOCK_COST_SQL = "sql/stock/sum-restock-cost.sql";
    private static final String SUM_WRITE_OFF_COST_SQL = "sql/stock/sum-write-off-cost.sql";

    private static final String LOW_STOCK_JPQL = """
        SELECT p FROM Product p
        WHERE p.company.id = :companyId AND p.isActive = true AND p.stockQuantity < p.lowStockAlert
        ORDER BY (p.lowStockAlert - p.stockQuantity) DESC, p.name ASC
        """;

    private static final String LOW_STOCK_COUNT_JPQL = """
        SELECT COUNT(p) FROM Product p
        WHERE p.company.id = :companyId AND p.isActive = true AND p.stockQuantity < p.lowStockAlert
        """;

    private static final String COUNT_ACTIVE_JPQL = """
        SELECT COUNT(p) FROM Product p
        WHERE p.company.id = :companyId AND p.isActive = true
        """;

    private static final String SUM_ACTIVE_STOCK_JPQL = """
        SELECT COALESCE(SUM(p.stockQuantity), 0), COALESCE(SUM(p.stockQuantity * p.costPrice), 0)
        FROM Product p WHERE p.isActive = true AND p.company.id = :companyId
        """;

    private static final String STOCK_BALANCES_JPQL = """
        SELECT p FROM Product p
        WHERE p.isActive = true
          AND p.company.id = :companyId
          AND (:categoryId IS NULL OR p.category.id = :categoryId)
          AND (
            :search = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
          )
          AND (
            :onlyWithStock = false OR p.stockQuantity > 0
          )
        ORDER BY p.name ASC
        """;

    private static final String STOCK_BALANCES_COUNT_JPQL = """
        SELECT COUNT(p) FROM Product p
        WHERE p.isActive = true
          AND p.company.id = :companyId
          AND (:categoryId IS NULL OR p.category.id = :categoryId)
          AND (
            :search = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
          )
          AND (
            :onlyWithStock = false OR p.stockQuantity > 0
          )
        """;

    private static final String SUM_QUANTITY_BY_TYPE_JPQL = """
        SELECT COALESCE(SUM(sm.quantity), 0)
        FROM StockMovement sm
        JOIN sm.product p
        WHERE sm.movementType = :type
          AND sm.createdAt >= :start AND sm.createdAt < :end
          AND (:storeId IS NULL OR sm.store.id = :storeId)
          AND p.company.id = :companyId
        """;

    private static final String FIND_WRITE_OFFS_JPQL = """
        SELECT sm FROM StockMovement sm
        JOIN sm.product p
        WHERE sm.movementType = 'WRITE_OFF'
          AND sm.createdAt >= :start AND sm.createdAt < :end
          AND (:storeId IS NULL OR sm.store.id = :storeId)
          AND p.company.id = :companyId
        ORDER BY sm.createdAt DESC
        """;

    private static final String COUNT_WRITE_OFFS_JPQL = """
        SELECT COUNT(sm) FROM StockMovement sm
        JOIN sm.product p
        WHERE sm.movementType = 'WRITE_OFF'
          AND sm.createdAt >= :start AND sm.createdAt < :end
          AND (:storeId IS NULL OR sm.store.id = :storeId)
          AND p.company.id = :companyId
        """;

    private static final String FIND_MOVEMENT_JOURNAL_JPQL = """
        SELECT sm FROM StockMovement sm
        JOIN sm.product p
        WHERE sm.createdAt >= :start AND sm.createdAt < :end
          AND (:movementType IS NULL OR sm.movementType = :movementType)
          AND (:storeId IS NULL OR sm.store.id = :storeId)
          AND p.company.id = :companyId
          AND (
            :search = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
          )
        ORDER BY sm.createdAt DESC
        """;

    private static final String COUNT_MOVEMENT_JOURNAL_JPQL = """
        SELECT COUNT(sm) FROM StockMovement sm
        JOIN sm.product p
        WHERE sm.createdAt >= :start AND sm.createdAt < :end
          AND (:movementType IS NULL OR sm.movementType = :movementType)
          AND (:storeId IS NULL OR sm.store.id = :storeId)
          AND p.company.id = :companyId
          AND (
            :search = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
          )
        """;

    private final ReportQueryExecutor reportQueryExecutor;
    private final EntityManager entityManager;
    private final SqlLoader sqlLoader;
    private final StockMovementJpaQueryExecutor stockMovementJpaQueryExecutor;

    @Override
    public Page<Object[]> stockTurnoverPage(
        Instant start,
        Instant end,
        Integer categoryId,
        String search,
        Integer companyId,
        Pageable pageable
    ) {
        return reportQueryExecutor.fetchPage(
            STOCK_TURNOVER_SQL,
            STOCK_TURNOVER_COUNT_SQL,
            query -> bindTurnoverParams(query, start, end, categoryId, search, companyId),
            pageable
        );
    }

    @Override
    public Page<Object[]> deadStockPage(
        LocalDate asOfDate,
        LocalDate cutoffDate,
        int daysNoSale,
        Integer categoryId,
        String search,
        Integer companyId,
        Pageable pageable
    ) {
        return reportQueryExecutor.fetchPage(
            DEAD_STOCK_SQL,
            DEAD_STOCK_COUNT_SQL,
            query -> bindDeadStockParams(query, asOfDate, cutoffDate, daysNoSale, categoryId, search, companyId),
            pageable
        );
    }

    @Override
    public Page<Product> lowStockPage(Integer companyId, Pageable pageable) {
        long total = countQuery(LOW_STOCK_COUNT_JPQL, companyId);
        if (total == 0) {
            return new PageImpl<>(List.of(), pageable, 0);
        }
        TypedQuery<Product> query = entityManager.createQuery(LOW_STOCK_JPQL, Product.class);
        bindCompanyId(query, companyId);
        applyPagination(query, pageable);
        applyCategoryGraph(query);
        return new PageImpl<>(query.getResultList(), pageable, total);
    }

    @Override
    public List<Product> lowStockProducts(Integer companyId, Pageable pageable) {
        TypedQuery<Product> query = entityManager.createQuery(LOW_STOCK_JPQL, Product.class);
        bindCompanyId(query, companyId);
        applyPagination(query, pageable);
        return query.getResultList();
    }

    @Override
    public long countActiveProducts(Integer companyId) {
        return countQuery(COUNT_ACTIVE_JPQL, companyId);
    }

    @Override
    public long countLowStockProducts(Integer companyId) {
        return countQuery(LOW_STOCK_COUNT_JPQL, companyId);
    }

    @Override
    public Object[] sumActiveStockUnitsAndCost(Integer companyId) {
        Object result = entityManager.createQuery(SUM_ACTIVE_STOCK_JPQL, Object[].class)
            .setParameter("companyId", companyId)
            .getSingleResult();
        return (Object[]) result;
    }

    @Override
    public Page<Product> stockBalancesPage(
        Integer companyId,
        Integer categoryId,
        String search,
        boolean onlyWithStock,
        Pageable pageable
    ) {
        long total = entityManager.createQuery(STOCK_BALANCES_COUNT_JPQL, Long.class)
            .setParameter("companyId", companyId)
            .setParameter("categoryId", categoryId)
            .setParameter("search", search)
            .setParameter("onlyWithStock", onlyWithStock)
            .getSingleResult();
        if (total == 0) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        TypedQuery<Product> query = entityManager.createQuery(STOCK_BALANCES_JPQL, Product.class);
        query.setParameter("companyId", companyId);
        query.setParameter("categoryId", categoryId);
        query.setParameter("search", search);
        query.setParameter("onlyWithStock", onlyWithStock);
        applyPagination(query, pageable);
        applyCategoryGraph(query);
        return new PageImpl<>(query.getResultList(), pageable, total);
    }

    @Override
    public long sumQuantityByTypeBetween(
        String type,
        Instant start,
        Instant end,
        Integer storeId,
        Integer companyId
    ) {
        Long sum = entityManager.createQuery(SUM_QUANTITY_BY_TYPE_JPQL, Long.class)
            .setParameter("type", type)
            .setParameter("start", start)
            .setParameter("end", end)
            .setParameter("storeId", storeId)
            .setParameter("companyId", companyId)
            .getSingleResult();
        return sum != null ? sum : 0L;
    }

    @Override
    public List<Object[]> dailyStockMovementAggregates(
        Instant start,
        Instant end,
        Integer storeId,
        Integer companyId
    ) {
        return reportQueryExecutor.fetchList(DAILY_STOCK_MOVEMENT_SQL, query -> {
            query.setParameter("start", start);
            query.setParameter("end", end);
            query.setParameter("storeId", storeId);
            query.setParameter("companyId", companyId);
        });
    }

    @Override
    public BigDecimal sumRestockCostBetween(Instant start, Instant end, Integer storeId, Integer companyId) {
        return toBigDecimal(entityManager.createNativeQuery(sqlLoader.load(SUM_RESTOCK_COST_SQL))
            .setParameter("start", start)
            .setParameter("end", end)
            .setParameter("storeId", storeId)
            .setParameter("companyId", companyId)
            .getSingleResult());
    }

    @Override
    public BigDecimal sumWriteOffCostBetween(Instant start, Instant end, Integer storeId, Integer companyId) {
        return toBigDecimal(entityManager.createNativeQuery(sqlLoader.load(SUM_WRITE_OFF_COST_SQL))
            .setParameter("start", start)
            .setParameter("end", end)
            .setParameter("storeId", storeId)
            .setParameter("companyId", companyId)
            .getSingleResult());
    }

    @Override
    public Page<StockMovement> findWriteOffsBetween(
        Instant start,
        Instant end,
        Integer storeId,
        Integer companyId,
        Pageable pageable
    ) {
        return stockMovementJpaQueryExecutor.fetchPage(
            FIND_WRITE_OFFS_JPQL,
            COUNT_WRITE_OFFS_JPQL,
            query -> bindWriteOffParams(query, start, end, storeId, companyId),
            pageable
        );
    }

    @Override
    public Page<StockMovement> findMovementJournal(
        Instant start,
        Instant end,
        String movementType,
        Integer storeId,
        Integer companyId,
        String search,
        Pageable pageable
    ) {
        return stockMovementJpaQueryExecutor.fetchPage(
            FIND_MOVEMENT_JOURNAL_JPQL,
            COUNT_MOVEMENT_JOURNAL_JPQL,
            query -> bindMovementJournalParams(query, start, end, movementType, storeId, companyId, search),
            pageable
        );
    }

    private long countQuery(String jpql, Integer companyId) {
        Long count = entityManager.createQuery(jpql, Long.class)
            .setParameter("companyId", companyId)
            .getSingleResult();
        return count != null ? count : 0L;
    }

    private static void bindCompanyId(TypedQuery<?> query, Integer companyId) {
        query.setParameter("companyId", companyId);
    }

    private static void applyPagination(TypedQuery<?> query, Pageable pageable) {
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());
    }

    private void applyCategoryGraph(TypedQuery<Product> query) {
        EntityGraph<Product> graph = entityManager.createEntityGraph(Product.class);
        graph.addAttributeNodes("category");
        query.setHint("jakarta.persistence.fetchgraph", graph);
    }

    private static void bindTurnoverParams(
        Query query,
        Instant start,
        Instant end,
        Integer categoryId,
        String search,
        Integer companyId
    ) {
        query.setParameter("start", start);
        query.setParameter("end", end);
        query.setParameter("categoryId", categoryId);
        query.setParameter("search", search);
        query.setParameter("companyId", companyId);
    }

    private static void bindDeadStockParams(
        Query query,
        LocalDate asOfDate,
        LocalDate cutoffDate,
        int daysNoSale,
        Integer categoryId,
        String search,
        Integer companyId
    ) {
        query.setParameter("asOfDate", asOfDate);
        query.setParameter("cutoffDate", cutoffDate);
        query.setParameter("daysNoSale", daysNoSale);
        query.setParameter("categoryId", categoryId);
        query.setParameter("search", search);
        query.setParameter("companyId", companyId);
    }

    private static BigDecimal toBigDecimal(Object result) {
        if (result == null) {
            return BigDecimal.ZERO;
        }
        if (result instanceof BigDecimal bd) {
            return bd;
        }
        return new BigDecimal(result.toString());
    }

    private static void bindWriteOffParams(
        TypedQuery<?> query,
        Instant start,
        Instant end,
        Integer storeId,
        Integer companyId
    ) {
        query.setParameter("start", start);
        query.setParameter("end", end);
        query.setParameter("storeId", storeId);
        query.setParameter("companyId", companyId);
    }

    private static void bindMovementJournalParams(
        TypedQuery<?> query,
        Instant start,
        Instant end,
        String movementType,
        Integer storeId,
        Integer companyId,
        String search
    ) {
        query.setParameter("start", start);
        query.setParameter("end", end);
        query.setParameter("movementType", movementType);
        query.setParameter("storeId", storeId);
        query.setParameter("companyId", companyId);
        query.setParameter("search", search);
    }
}
