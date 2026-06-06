package com.pos.repository.sale.impl;

import com.pos.entity.Sale;
import com.pos.repository.report.ReportQueryExecutor;
import com.pos.repository.sale.ShiftReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class ShiftReportRepositoryImpl implements ShiftReportRepository {

    private static final String AGGREGATE_SHIFT_SALES_SQL = "sql/sales/aggregate-shift-sales.sql";
    private static final String AGGREGATE_BY_SHIFT_ID_SQL = "sql/sales/aggregate-by-shift-id.sql";
    private static final String AGGREGATE_SHIFT_BANNER_BY_SHIFT_ID_SQL =
        "sql/sales/aggregate-shift-banner-by-shift-id.sql";
    private static final String AGGREGATE_SHIFT_BANNER_BY_CASHIER_TIME_SQL =
        "sql/sales/aggregate-shift-banner-by-cashier-time.sql";
    private static final String AGGREGATE_RETURNS_BY_SHIFT_ID_SQL = "sql/sales/aggregate-returns-by-shift-id.sql";
    private static final String AGGREGATE_RETURNS_BY_CASHIER_TIME_SQL =
        "sql/sales/aggregate-returns-by-cashier-time.sql";

    private static final String FIND_COMPLETED_FOR_Z_REPORT_JPQL = """
        SELECT DISTINCT s FROM Sale s
        JOIN FETCH s.cashier
        LEFT JOIN FETCH s.items i
        LEFT JOIN FETCH i.product
        WHERE s.cashierShift.zReport.id = :zReportId
          AND s.status = :status
        ORDER BY s.createdAt ASC
        """;

    private final ReportQueryExecutor reportQueryExecutor;
    private final SaleJpaQueryExecutor saleJpaQueryExecutor;

    @Override
    public List<Object[]> aggregateShiftSales(UUID cashierId, Integer storeId, Instant from, Instant to) {
        return reportQueryExecutor.fetchList(AGGREGATE_SHIFT_SALES_SQL, query -> {
            query.setParameter("cashierId", cashierId);
            query.setParameter("storeId", storeId);
            query.setParameter("from", from);
            query.setParameter("to", to);
        });
    }

    @Override
    public List<Object[]> aggregateByShiftId(UUID shiftId, Instant periodFrom, Instant reportAt) {
        return reportQueryExecutor.fetchList(AGGREGATE_BY_SHIFT_ID_SQL, query -> {
            query.setParameter("shiftId", shiftId);
            query.setParameter("periodFrom", periodFrom);
            query.setParameter("reportAt", reportAt);
        });
    }

    @Override
    public List<Object[]> aggregateShiftBannerByShiftId(UUID shiftId, Instant periodFrom, Instant reportAt) {
        return reportQueryExecutor.fetchList(AGGREGATE_SHIFT_BANNER_BY_SHIFT_ID_SQL, query -> {
            query.setParameter("shiftId", shiftId);
            query.setParameter("periodFrom", periodFrom);
            query.setParameter("reportAt", reportAt);
        });
    }

    @Override
    public List<Object[]> aggregateShiftBannerByCashierAndTime(
        UUID cashierId,
        Integer storeId,
        Instant from,
        Instant to
    ) {
        return reportQueryExecutor.fetchList(AGGREGATE_SHIFT_BANNER_BY_CASHIER_TIME_SQL, query -> {
            query.setParameter("cashierId", cashierId);
            query.setParameter("storeId", storeId);
            query.setParameter("from", from);
            query.setParameter("to", to);
        });
    }

    @Override
    public List<Object[]> aggregateReturnsByShiftId(UUID shiftId, Instant periodFrom, Instant reportAt) {
        return reportQueryExecutor.fetchList(AGGREGATE_RETURNS_BY_SHIFT_ID_SQL, query -> {
            query.setParameter("shiftId", shiftId);
            query.setParameter("periodFrom", periodFrom);
            query.setParameter("reportAt", reportAt);
        });
    }

    @Override
    public List<Object[]> aggregateReturnsByCashierAndTime(
        UUID cashierId,
        Integer storeId,
        Instant periodFrom,
        Instant reportAt
    ) {
        return reportQueryExecutor.fetchList(AGGREGATE_RETURNS_BY_CASHIER_TIME_SQL, query -> {
            query.setParameter("cashierId", cashierId);
            query.setParameter("storeId", storeId);
            query.setParameter("periodFrom", periodFrom);
            query.setParameter("reportAt", reportAt);
        });
    }

    @Override
    public List<Sale> findCompletedForZReport(Long zReportId, Sale.SaleStatus status) {
        return saleJpaQueryExecutor.fetchList(FIND_COMPLETED_FOR_Z_REPORT_JPQL, query -> {
            query.setParameter("zReportId", zReportId);
            query.setParameter("status", status);
        });
    }
}
