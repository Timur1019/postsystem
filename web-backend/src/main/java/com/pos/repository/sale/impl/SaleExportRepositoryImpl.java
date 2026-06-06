package com.pos.repository.sale.impl;

import com.pos.entity.Sale;
import com.pos.repository.sale.SaleExportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class SaleExportRepositoryImpl implements SaleExportRepository {

    private static final String FIND_COMPLETED_FOR_EXPORT_JPQL = """
        SELECT DISTINCT s FROM Sale s
        JOIN FETCH s.cashier
        LEFT JOIN FETCH s.items i
        LEFT JOIN FETCH i.product
        WHERE s.createdAt >= :from AND s.createdAt <= :to AND s.status = :st
        ORDER BY s.createdAt ASC
        """;

    private static final String FIND_SUMMARIES_FOR_LEDGER_JPQL = """
        SELECT DISTINCT s FROM Sale s
        JOIN FETCH s.cashier
        LEFT JOIN FETCH s.store
        LEFT JOIN FETCH s.customer
        LEFT JOIN FETCH s.cashierShift sh
        LEFT JOIN FETCH sh.zReport
        LEFT JOIN FETCH s.items
        WHERE s.createdAt >= :start AND s.createdAt < :end
        ORDER BY s.createdAt DESC
        """;

    private final SaleJpaQueryExecutor saleJpaQueryExecutor;

    @Override
    public List<Sale> findCompletedForExportBetween(Instant from, Instant to, Sale.SaleStatus status) {
        return saleJpaQueryExecutor.fetchList(FIND_COMPLETED_FOR_EXPORT_JPQL, query -> {
            query.setParameter("from", from);
            query.setParameter("to", to);
            query.setParameter("st", status);
        });
    }

    @Override
    public List<Sale> findSummariesForLedgerBetween(Instant start, Instant end) {
        return saleJpaQueryExecutor.fetchList(FIND_SUMMARIES_FOR_LEDGER_JPQL, query -> {
            query.setParameter("start", start);
            query.setParameter("end", end);
        });
    }
}
