package com.pos.repository.sale;

import com.pos.entity.Sale;

import java.time.Instant;
import java.util.List;

public interface SaleExportRepository {

    List<Sale> findCompletedForExportBetween(Instant from, Instant to, Sale.SaleStatus status);

    List<Sale> findSummariesForLedgerBetween(Instant start, Instant end);
}
