package com.pos.repository;

import com.pos.entity.Sale;
import com.pos.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface SaleItemRepository extends JpaRepository<SaleItem, UUID> {

    long countBySale_Id(UUID saleId);

    @Query("""
        SELECT COALESCE(SUM(si.quantity), 0)
        FROM SaleItem si
        JOIN si.sale s
        WHERE s.createdAt >= :start AND s.createdAt < :end AND s.status = :status
        """)
    long sumQuantitySoldBetween(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("status") Sale.SaleStatus status
    );

    @Query(value = """
        SELECT si.product_name AS productName, CAST(SUM(si.quantity) AS BIGINT) AS quantitySold
        FROM sale_items si
        INNER JOIN sales s ON s.id = si.sale_id
        WHERE CAST(s.created_at AS date) BETWEEN CAST(:from AS date) AND CAST(:to AS date)
        AND s.status = 'COMPLETED'
        GROUP BY si.product_name
        ORDER BY SUM(si.quantity) DESC
        LIMIT :limit
        """, nativeQuery = true)
    java.util.List<Object[]> topProductsRaw(
        @Param("from") java.time.LocalDate from,
        @Param("to") java.time.LocalDate to,
        @Param("limit") int limit
    );

    @Query(value = """
        SELECT u.full_name AS cashierName, COALESCE(SUM(s.total_amount), 0) AS revenue
        FROM sales s
        INNER JOIN users u ON u.id = s.cashier_id
        WHERE CAST(s.created_at AS date) BETWEEN CAST(:from AS date) AND CAST(:to AS date)
        AND s.status = 'COMPLETED'
        GROUP BY u.id, u.full_name
        ORDER BY revenue DESC
        """, nativeQuery = true)
    java.util.List<Object[]> cashierPerformanceRaw(
        @Param("from") java.time.LocalDate from,
        @Param("to") java.time.LocalDate to
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
}
