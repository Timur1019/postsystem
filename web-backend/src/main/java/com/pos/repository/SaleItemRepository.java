package com.pos.repository;

import com.pos.entity.Sale;
import com.pos.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface SaleItemRepository extends JpaRepository<SaleItem, UUID> {

    long countBySale_Id(UUID saleId);

    @Query("""
        SELECT COALESCE(SUM(si.quantity), 0)
        FROM SaleItem si
        JOIN si.sale s
        WHERE s.createdAt >= :start AND s.createdAt < :end AND s.status = :status
        AND (:storeId IS NULL OR s.store.id = :storeId)
        """)
    long sumQuantitySoldBetween(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("status") Sale.SaleStatus status,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT COALESCE(SUM(si.quantity - si.returnedQuantity), 0)
        FROM SaleItem si
        JOIN si.sale s
        WHERE s.createdAt >= :start AND s.createdAt < :end AND s.status = :status
        AND (:storeId IS NULL OR s.store.id = :storeId)
        """)
    long sumNetQuantitySoldBetween(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("status") Sale.SaleStatus status,
        @Param("storeId") Integer storeId
    );

    @Query(value = """
        SELECT si.product_name AS productName, CAST(SUM(si.quantity) AS BIGINT) AS quantitySold
        FROM sale_items si
        INNER JOIN sales s ON s.id = si.sale_id
        WHERE CAST(s.created_at AS date) BETWEEN :fromDate AND :toDate
        AND s.status = 'COMPLETED'
        GROUP BY si.product_name
        ORDER BY SUM(si.quantity) DESC
        LIMIT :limit
        """, nativeQuery = true)
    java.util.List<Object[]> topProductsRaw(
        @Param("fromDate") java.time.LocalDate from,
        @Param("toDate") java.time.LocalDate to,
        @Param("limit") int limit
    );

    @Query(value = """
        SELECT u.full_name AS cashierName, COALESCE(SUM(s.total_amount), 0) AS revenue
        FROM sales s
        INNER JOIN users u ON u.id = s.cashier_id
        WHERE CAST(s.created_at AS date) BETWEEN :fromDate AND :toDate
        AND s.status = 'COMPLETED'
        GROUP BY u.id, u.full_name
        ORDER BY revenue DESC
        """, nativeQuery = true)
    java.util.List<Object[]> cashierPerformanceRaw(
        @Param("fromDate") java.time.LocalDate from,
        @Param("toDate") java.time.LocalDate to
    );

    @Query(value = """
        SELECT CAST(s.created_at AS date) AS day,
               COALESCE(SUM(si.quantity), 0) AS items_sold
        FROM sale_items si
        INNER JOIN sales s ON s.id = si.sale_id
        WHERE s.created_at >= :start AND s.created_at < :end
          AND s.status = 'COMPLETED'
        GROUP BY CAST(s.created_at AS date)
        ORDER BY day
        """, nativeQuery = true)
    java.util.List<Object[]> dailyItemsSoldAggregates(
        @Param("start") Instant start,
        @Param("end") Instant end
    );

    @Query(value = """
        SELECT CAST(s.created_at AS date) AS day,
               COALESCE(SUM(si.quantity - si.returned_quantity), 0) AS sold_units
        FROM sale_items si
        INNER JOIN sales s ON s.id = si.sale_id
        WHERE s.created_at >= :start AND s.created_at < :end
          AND s.status = 'COMPLETED'
          AND (:storeId IS NULL OR s.store_id = :storeId)
        GROUP BY CAST(s.created_at AS date)
        ORDER BY day
        """, nativeQuery = true)
    java.util.List<Object[]> dailySoldUnitsAggregates(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("storeId") Integer storeId
    );

    @Query(value = """
        SELECT COALESCE(SUM(p.cost_price * (si.quantity - si.returned_quantity)), 0)
        FROM sale_items si
        INNER JOIN sales s ON s.id = si.sale_id
        INNER JOIN products p ON p.id = si.product_id
        WHERE s.created_at >= :start AND s.created_at < :end
          AND s.status = 'COMPLETED'
          AND (:storeId IS NULL OR s.store_id = :storeId)
        """, nativeQuery = true)
    java.math.BigDecimal sumCostEstimateBetween(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("storeId") Integer storeId
    );

    @Query(value = """
        SELECT CAST(s.created_at AS date) AS day,
               COALESCE(SUM(p.cost_price * (si.quantity - si.returned_quantity)), 0) AS cost_estimate
        FROM sale_items si
        INNER JOIN sales s ON s.id = si.sale_id
        INNER JOIN products p ON p.id = si.product_id
        WHERE s.created_at >= :start AND s.created_at < :end
          AND s.status = 'COMPLETED'
        GROUP BY CAST(s.created_at AS date)
        ORDER BY day
        """, nativeQuery = true)
    List<Object[]> dailyCostEstimateAggregates(
        @Param("start") Instant start,
        @Param("end") Instant end
    );
}
