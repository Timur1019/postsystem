package com.pos.repository.report;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface SalesReportRepository {

    Page<Object[]> productSalesPage(
        LocalDate fromDate,
        LocalDate toDate,
        Integer storeId,
        Integer categoryId,
        String search,
        Integer companyId,
        Pageable pageable
    );

    Page<Object[]> categorySalesPage(
        LocalDate fromDate,
        LocalDate toDate,
        Integer storeId,
        Integer companyId,
        Pageable pageable
    );

    Page<Object[]> storeSalesPage(
        LocalDate fromDate,
        LocalDate toDate,
        Integer companyId,
        Pageable pageable
    );
}
