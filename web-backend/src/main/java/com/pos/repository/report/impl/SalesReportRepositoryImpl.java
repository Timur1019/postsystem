package com.pos.repository.report.impl;

import com.pos.repository.report.ReportQueryExecutor;
import com.pos.repository.report.SalesReportRepository;
import com.pos.util.NativeQueryParams;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
@RequiredArgsConstructor
public class SalesReportRepositoryImpl implements SalesReportRepository {

    private static final String PRODUCT_SALES_SQL = "sql/reports/product-sales-report.sql";
    private static final String PRODUCT_SALES_COUNT_SQL = "sql/reports/product-sales-report-count.sql";
    private static final String CATEGORY_SALES_SQL = "sql/reports/category-sales-report.sql";
    private static final String CATEGORY_SALES_COUNT_SQL = "sql/reports/category-sales-report-count.sql";
    private static final String STORE_SALES_SQL = "sql/reports/store-sales-report.sql";
    private static final String STORE_SALES_COUNT_SQL = "sql/reports/store-sales-report-count.sql";

    private final ReportQueryExecutor reportQueryExecutor;

    @Override
    public Page<Object[]> productSalesPage(
        LocalDate fromDate,
        LocalDate toDate,
        Integer storeId,
        Integer categoryId,
        String search,
        Integer companyId,
        Pageable pageable
    ) {
        return reportQueryExecutor.fetchPage(
            PRODUCT_SALES_SQL,
            PRODUCT_SALES_COUNT_SQL,
            query -> bindProductSalesParams(query, fromDate, toDate, storeId, categoryId, search, companyId),
            pageable
        );
    }

    @Override
    public Page<Object[]> categorySalesPage(
        LocalDate fromDate,
        LocalDate toDate,
        Integer storeId,
        Integer companyId,
        Pageable pageable
    ) {
        return reportQueryExecutor.fetchPage(
            CATEGORY_SALES_SQL,
            CATEGORY_SALES_COUNT_SQL,
            query -> bindCategorySalesParams(query, fromDate, toDate, storeId, companyId),
            pageable
        );
    }

    @Override
    public Page<Object[]> storeSalesPage(
        LocalDate fromDate,
        LocalDate toDate,
        Integer companyId,
        Pageable pageable
    ) {
        return reportQueryExecutor.fetchPage(
            STORE_SALES_SQL,
            STORE_SALES_COUNT_SQL,
            query -> bindStoreSalesParams(query, fromDate, toDate, companyId),
            pageable
        );
    }

    private static void bindProductSalesParams(
        Query query,
        LocalDate fromDate,
        LocalDate toDate,
        Integer storeId,
        Integer categoryId,
        String search,
        Integer companyId
    ) {
        query.setParameter("fromDate", fromDate);
        query.setParameter("toDate", toDate);
        NativeQueryParams.setNullableInteger(query, "storeId", storeId);
        NativeQueryParams.setNullableInteger(query, "categoryId", categoryId);
        query.setParameter("search", search);
        query.setParameter("companyId", companyId);
    }

    private static void bindCategorySalesParams(
        Query query,
        LocalDate fromDate,
        LocalDate toDate,
        Integer storeId,
        Integer companyId
    ) {
        query.setParameter("fromDate", fromDate);
        query.setParameter("toDate", toDate);
        NativeQueryParams.setNullableInteger(query, "storeId", storeId);
        query.setParameter("companyId", companyId);
    }

    private static void bindStoreSalesParams(
        Query query,
        LocalDate fromDate,
        LocalDate toDate,
        Integer companyId
    ) {
        query.setParameter("fromDate", fromDate);
        query.setParameter("toDate", toDate);
        query.setParameter("companyId", companyId);
    }
}
