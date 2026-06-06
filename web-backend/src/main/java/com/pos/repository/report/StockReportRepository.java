package com.pos.repository.report;

import com.pos.entity.Product;
import com.pos.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface StockReportRepository {

    Page<Object[]> stockTurnoverPage(
        Instant start,
        Instant end,
        Integer categoryId,
        String search,
        Integer companyId,
        Pageable pageable
    );

    Page<Object[]> deadStockPage(
        LocalDate asOfDate,
        LocalDate cutoffDate,
        int daysNoSale,
        Integer categoryId,
        String search,
        Integer companyId,
        Pageable pageable
    );

    Page<Product> lowStockPage(Integer companyId, Pageable pageable);

    List<Product> lowStockProducts(Integer companyId, Pageable pageable);

    long countActiveProducts(Integer companyId);

    long countLowStockProducts(Integer companyId);

    Object[] sumActiveStockUnitsAndCost(Integer companyId);

    Page<Product> stockBalancesPage(
        Integer companyId,
        Integer categoryId,
        String search,
        boolean onlyWithStock,
        Pageable pageable
    );

    long sumQuantityByTypeBetween(
        String type,
        Instant start,
        Instant end,
        Integer storeId,
        Integer companyId
    );

    List<Object[]> dailyStockMovementAggregates(
        Instant start,
        Instant end,
        Integer storeId,
        Integer companyId
    );

    BigDecimal sumRestockCostBetween(Instant start, Instant end, Integer storeId, Integer companyId);

    BigDecimal sumWriteOffCostBetween(Instant start, Instant end, Integer storeId, Integer companyId);

    Page<StockMovement> findWriteOffsBetween(
        Instant start,
        Instant end,
        Integer storeId,
        Integer companyId,
        Pageable pageable
    );

    Page<StockMovement> findMovementJournal(
        Instant start,
        Instant end,
        String movementType,
        Integer storeId,
        Integer companyId,
        String search,
        Pageable pageable
    );
}
