package com.pos.repository.sale;

import com.pos.entity.Sale;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface SaleAggregateRepository {

    BigDecimal sumTotalBetween(
        Instant start,
        Instant end,
        Sale.SaleStatus status,
        Integer storeId,
        Integer companyId
    );

    long countSalesBetween(
        Instant start,
        Instant end,
        Sale.SaleStatus status,
        Integer storeId,
        Integer companyId
    );

    List<Object[]> aggregateReturnsBetween(
        Instant start,
        Instant end,
        List<Sale.SaleStatus> statuses,
        Integer companyId
    );

    List<Object[]> dailyRevenueAggregates(Instant start, Instant end, Integer companyId);

    List<Object[]> salesByStoreBetween(Instant start, Instant end, Integer companyId);

    long sumQuantitySoldBetween(
        Instant start,
        Instant end,
        Sale.SaleStatus status,
        Integer storeId,
        Integer companyId
    );

    long sumNetQuantitySoldBetween(
        Instant start,
        Instant end,
        Sale.SaleStatus status,
        Integer storeId,
        Integer companyId
    );

    BigDecimal sumCostEstimateBetween(Instant start, Instant end, Integer storeId, Integer companyId);

    List<Object[]> topProductsRaw(LocalDate from, LocalDate to, int limit, Integer companyId);

    List<Object[]> cashierPerformanceRaw(LocalDate from, LocalDate to, Integer companyId);

    List<Object[]> dailyItemsSoldAggregates(Instant start, Instant end, Integer companyId);

    List<Object[]> dailySoldUnitsAggregates(Instant start, Instant end, Integer storeId, Integer companyId);

    List<Object[]> dailyCostEstimateAggregates(Instant start, Instant end, Integer companyId);

    List<Object[]> soldUnitsByProductAndStore(Instant start, Instant end, Integer companyId);
}
