package com.pos.repository;

import com.pos.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    /** Склад: активные товары без фильтров (обход проблем count + Specification). */
    @EntityGraph(attributePaths = {"category"})
    Page<Product> findByIsActiveTrue(Pageable pageable);

    boolean existsBySku(String sku);

    Optional<Product> findBySku(String sku);

    boolean existsBySkuAndIsActiveTrue(String sku);

    Optional<Product> findBySkuAndIsActiveTrue(String sku);

    boolean existsByNameIgnoreCase(String name);

    Optional<Product> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIsActiveTrue(String name);

    Optional<Product> findByNameIgnoreCaseAndIsActiveTrue(String name);

    boolean existsByIkpu(String ikpu);

    Optional<Product> findByIkpu(String ikpu);

    boolean existsByIkpuAndIsActiveTrue(String ikpu);

    Optional<Product> findByIkpuAndIsActiveTrue(String ikpu);

    Optional<Product> findByBarcode(String barcode);

    @Query("SELECT p FROM Product p WHERE p.stockQuantity <= p.lowStockAlert AND p.isActive = true")
    List<Product> findLowStockProducts();

    @EntityGraph(attributePaths = {"category"})
    @Query("""
        SELECT p FROM Product p
        WHERE p.isActive = true AND p.stockQuantity < p.lowStockAlert
        ORDER BY (p.lowStockAlert - p.stockQuantity) DESC, p.name ASC
        """)
    Page<Product> findLowStockPage(Pageable pageable);

    @Query("""
        SELECT COUNT(p) FROM Product p
        WHERE p.isActive = true AND p.stockQuantity < p.lowStockAlert
        """)
    long countLowStock();

    @Query("""
        SELECT COALESCE(SUM(p.stockQuantity), 0), COALESCE(SUM(p.stockQuantity * p.costPrice), 0)
        FROM Product p WHERE p.isActive = true
        """)
    Object[] sumActiveStockUnitsAndCost();

    @Query(value = """
        SELECT CAST(p.id AS varchar) AS product_id,
               p.name AS product_name,
               p.sku,
               COALESCE(p.barcode, '') AS barcode,
               COALESCE(c.name, '') AS category_name,
               COALESCE(SUM(si.quantity - si.returned_quantity), 0) AS net_qty,
               COALESCE(SUM(si.returned_quantity), 0) AS returned_qty,
               COALESCE(SUM(
                 CASE WHEN si.quantity > 0 THEN
                   si.line_total * CAST((si.quantity - si.returned_quantity) AS numeric) / si.quantity
                 ELSE 0 END
               ), 0) AS revenue,
               COALESCE(SUM(p.cost_price * (si.quantity - si.returned_quantity)), 0) AS cost_estimate
        FROM sale_items si
        INNER JOIN sales s ON s.id = si.sale_id
        INNER JOIN products p ON p.id = si.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE s.status = 'COMPLETED'
          AND CAST(s.created_at AS date) BETWEEN :fromDate AND :toDate
          AND (:storeId IS NULL OR s.store_id = :storeId)
          AND (:categoryId IS NULL OR p.category_id = :categoryId)
          AND (
            :search = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
          )
        GROUP BY p.id, p.name, p.sku, p.barcode, c.name
        HAVING COALESCE(SUM(si.quantity - si.returned_quantity), 0) > 0
           OR COALESCE(SUM(si.returned_quantity), 0) > 0
        ORDER BY net_qty DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM (
          SELECT p.id
          FROM sale_items si
          INNER JOIN sales s ON s.id = si.sale_id
          INNER JOIN products p ON p.id = si.product_id
          WHERE s.status = 'COMPLETED'
            AND CAST(s.created_at AS date) BETWEEN :fromDate AND :toDate
            AND (:storeId IS NULL OR s.store_id = :storeId)
            AND (:categoryId IS NULL OR p.category_id = :categoryId)
            AND (
              :search = ''
              OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
              OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
              OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
            )
          GROUP BY p.id
          HAVING COALESCE(SUM(si.quantity - si.returned_quantity), 0) > 0
             OR COALESCE(SUM(si.returned_quantity), 0) > 0
        ) sub
        """,
        nativeQuery = true)
    Page<Object[]> productSalesReportPage(
        @Param("fromDate") java.time.LocalDate from,
        @Param("toDate") java.time.LocalDate to,
        @Param("storeId") Integer storeId,
        @Param("categoryId") Integer categoryId,
        @Param("search") String search,
        Pageable pageable
    );

    Optional<Product> findByUzInvoiceDocumentIdAndIkpuAndIsActiveTrue(
        String uzInvoiceDocumentId,
        String ikpu
    );

    Optional<Product> findByUzInvoiceDocumentIdAndSkuAndIsActiveTrue(
        String uzInvoiceDocumentId,
        String sku
    );

    boolean existsByUzInvoiceDocumentIdAndIsActiveTrue(String uzInvoiceDocumentId);

    Optional<Product> findFirstByUzInvoiceDocumentIdAndIsActiveTrue(String uzInvoiceDocumentId);

    boolean existsBySkuStartingWithAndIsActiveTrue(String skuPrefix);

    Optional<Product> findFirstBySkuStartingWithAndIsActiveTrueOrderBySkuAsc(String skuPrefix);

    @Query(value = """
        SELECT CAST(p.id AS varchar) AS product_id,
               p.name AS product_name,
               p.sku,
               COALESCE(c.name, '') AS category_name,
               (p.stock_quantity - COALESCE((
                   SELECT SUM(sm.quantity) FROM stock_movements sm
                   WHERE sm.product_id = p.id AND sm.created_at >= :start
               ), 0)) AS opening_qty,
               COALESCE((
                   SELECT SUM(sm.quantity) FROM stock_movements sm
                   WHERE sm.product_id = p.id AND sm.movement_type = 'RESTOCK'
                     AND sm.quantity > 0 AND sm.created_at >= :start AND sm.created_at < :end
               ), 0) AS received_qty,
               COALESCE((
                   SELECT SUM(sm.quantity) FROM stock_movements sm
                   WHERE sm.product_id = p.id AND sm.movement_type = 'RETURN'
                     AND sm.quantity > 0 AND sm.created_at >= :start AND sm.created_at < :end
               ), 0) AS returned_qty,
               COALESCE((
                   SELECT SUM(-sm.quantity) FROM stock_movements sm
                   WHERE sm.product_id = p.id AND sm.movement_type = 'SALE'
                     AND sm.quantity < 0 AND sm.created_at >= :start AND sm.created_at < :end
               ), 0) AS sold_qty,
               COALESCE((
                   SELECT SUM(-sm.quantity) FROM stock_movements sm
                   WHERE sm.product_id = p.id AND sm.movement_type = 'WRITE_OFF'
                     AND sm.quantity < 0 AND sm.created_at >= :start AND sm.created_at < :end
               ), 0) AS write_off_qty,
               COALESCE((
                   SELECT SUM(sm.quantity) FROM stock_movements sm
                   WHERE sm.product_id = p.id AND sm.movement_type = 'ADJUSTMENT'
                     AND sm.created_at >= :start AND sm.created_at < :end
               ), 0) AS adjustment_qty,
               (p.stock_quantity - COALESCE((
                   SELECT SUM(sm.quantity) FROM stock_movements sm
                   WHERE sm.product_id = p.id AND sm.created_at >= :end
               ), 0)) AS closing_qty,
               (p.stock_quantity - COALESCE((
                   SELECT SUM(sm.quantity) FROM stock_movements sm
                   WHERE sm.product_id = p.id AND sm.created_at >= :end
               ), 0)) * p.cost_price AS closing_cost
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.is_active = true
          AND (:categoryId IS NULL OR p.category_id = :categoryId)
          AND (
            :search = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
          )
          AND (
            EXISTS (
              SELECT 1 FROM stock_movements sm2
              WHERE sm2.product_id = p.id AND sm2.created_at >= :start AND sm2.created_at < :end
            )
            OR p.stock_quantity <> 0
          )
        ORDER BY p.name ASC
        """,
        countQuery = """
        SELECT COUNT(*) FROM products p
        WHERE p.is_active = true
          AND (:categoryId IS NULL OR p.category_id = :categoryId)
          AND (
            :search = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
          )
          AND (
            EXISTS (
              SELECT 1 FROM stock_movements sm2
              WHERE sm2.product_id = p.id AND sm2.created_at >= :start AND sm2.created_at < :end
            )
            OR p.stock_quantity <> 0
          )
        """,
        nativeQuery = true)
    Page<Object[]> stockTurnoverPage(
        @Param("start") java.time.Instant start,
        @Param("end") java.time.Instant end,
        @Param("categoryId") Integer categoryId,
        @Param("search") String search,
        Pageable pageable
    );

    @Query(value = """
        SELECT c.id AS category_id,
               COALESCE(c.name, '') AS category_name,
               COUNT(DISTINCT s.id) AS receipt_count,
               COALESCE(SUM(si.quantity - si.returned_quantity), 0) AS net_qty,
               COALESCE(SUM(si.returned_quantity), 0) AS returned_qty,
               COALESCE(SUM(
                 CASE WHEN si.quantity > 0 THEN
                   si.line_total * CAST((si.quantity - si.returned_quantity) AS numeric) / si.quantity
                 ELSE 0 END
               ), 0) AS revenue,
               COALESCE(SUM(p.cost_price * (si.quantity - si.returned_quantity)), 0) AS cost_estimate
        FROM sale_items si
        INNER JOIN sales s ON s.id = si.sale_id
        INNER JOIN products p ON p.id = si.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE s.status = 'COMPLETED'
          AND CAST(s.created_at AS date) BETWEEN :fromDate AND :toDate
          AND (:storeId IS NULL OR s.store_id = :storeId)
        GROUP BY c.id, c.name
        HAVING COALESCE(SUM(si.quantity - si.returned_quantity), 0) > 0
           OR COALESCE(SUM(si.returned_quantity), 0) > 0
        ORDER BY revenue DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM (
          SELECT c.id
          FROM sale_items si
          INNER JOIN sales s ON s.id = si.sale_id
          INNER JOIN products p ON p.id = si.product_id
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE s.status = 'COMPLETED'
            AND CAST(s.created_at AS date) BETWEEN :fromDate AND :toDate
            AND (:storeId IS NULL OR s.store_id = :storeId)
          GROUP BY c.id, c.name
          HAVING COALESCE(SUM(si.quantity - si.returned_quantity), 0) > 0
             OR COALESCE(SUM(si.returned_quantity), 0) > 0
        ) sub
        """,
        nativeQuery = true)
    Page<Object[]> categorySalesReportPage(
        @Param("fromDate") java.time.LocalDate from,
        @Param("toDate") java.time.LocalDate to,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @Query(value = """
        SELECT st.id AS store_id,
               COALESCE(st.name, '') AS store_name,
               COUNT(DISTINCT s.id) AS receipt_count,
               COALESCE(SUM(si.quantity - si.returned_quantity), 0) AS net_qty,
               COALESCE(SUM(si.returned_quantity), 0) AS returned_qty,
               COALESCE(SUM(
                 CASE WHEN si.quantity > 0 THEN
                   si.line_total * CAST((si.quantity - si.returned_quantity) AS numeric) / si.quantity
                 ELSE 0 END
               ), 0) AS revenue,
               COALESCE(SUM(p.cost_price * (si.quantity - si.returned_quantity)), 0) AS cost_estimate
        FROM sale_items si
        INNER JOIN sales s ON s.id = si.sale_id
        INNER JOIN products p ON p.id = si.product_id
        INNER JOIN stores st ON st.id = s.store_id
        WHERE s.status = 'COMPLETED'
          AND CAST(s.created_at AS date) BETWEEN :fromDate AND :toDate
        GROUP BY st.id, st.name
        HAVING COALESCE(SUM(si.quantity - si.returned_quantity), 0) > 0
           OR COALESCE(SUM(si.returned_quantity), 0) > 0
        ORDER BY revenue DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM (
          SELECT st.id
          FROM sale_items si
          INNER JOIN sales s ON s.id = si.sale_id
          INNER JOIN stores st ON st.id = s.store_id
          WHERE s.status = 'COMPLETED'
            AND CAST(s.created_at AS date) BETWEEN :fromDate AND :toDate
          GROUP BY st.id, st.name
          HAVING COALESCE(SUM(si.quantity - si.returned_quantity), 0) > 0
             OR COALESCE(SUM(si.returned_quantity), 0) > 0
        ) sub
        """,
        nativeQuery = true)
    Page<Object[]> storeSalesReportPage(
        @Param("fromDate") java.time.LocalDate from,
        @Param("toDate") java.time.LocalDate to,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"category"})
    @Query("""
        SELECT p FROM Product p
        WHERE p.isActive = true
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
        """)
    Page<Product> stockBalancesPage(
        @Param("categoryId") Integer categoryId,
        @Param("search") String search,
        @Param("onlyWithStock") boolean onlyWithStock,
        Pageable pageable
    );

    @Query(value = """
        SELECT CAST(p.id AS varchar) AS product_id,
               p.name AS product_name,
               p.sku,
               COALESCE(p.barcode, '') AS barcode,
               COALESCE(c.name, '') AS category_name,
               p.stock_quantity AS stock_qty,
               (p.stock_quantity * p.cost_price) AS stock_value,
               (
                 SELECT MAX(CAST(s.created_at AS date))
                 FROM sale_items si2
                 INNER JOIN sales s ON s.id = si2.sale_id
                 WHERE si2.product_id = p.id AND s.status = 'COMPLETED'
               ) AS last_sale_date,
               CASE
                 WHEN (
                   SELECT MAX(CAST(s.created_at AS date))
                   FROM sale_items si2
                   INNER JOIN sales s ON s.id = si2.sale_id
                   WHERE si2.product_id = p.id AND s.status = 'COMPLETED'
                 ) IS NULL THEN :daysNoSale
                 ELSE GREATEST(0, :asOfDate - (
                   SELECT MAX(CAST(s.created_at AS date))
                   FROM sale_items si2
                   INNER JOIN sales s ON s.id = si2.sale_id
                   WHERE si2.product_id = p.id AND s.status = 'COMPLETED'
                 ))
               END AS days_without_sale
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.is_active = true
          AND p.stock_quantity > 0
          AND (:categoryId IS NULL OR p.category_id = :categoryId)
          AND (
            :search = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
          )
          AND NOT EXISTS (
            SELECT 1 FROM sale_items si
            INNER JOIN sales s ON s.id = si.sale_id
            WHERE si.product_id = p.id
              AND s.status = 'COMPLETED'
              AND CAST(s.created_at AS date) > :cutoffDate
          )
        ORDER BY days_without_sale DESC, p.stock_quantity DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM products p
        WHERE p.is_active = true
          AND p.stock_quantity > 0
          AND (:categoryId IS NULL OR p.category_id = :categoryId)
          AND (
            :search = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
          )
          AND NOT EXISTS (
            SELECT 1 FROM sale_items si
            INNER JOIN sales s ON s.id = si.sale_id
            WHERE si.product_id = p.id
              AND s.status = 'COMPLETED'
              AND CAST(s.created_at AS date) > :cutoffDate
          )
        """,
        nativeQuery = true)
    Page<Object[]> deadStockPage(
        @Param("asOfDate") java.time.LocalDate asOfDate,
        @Param("cutoffDate") java.time.LocalDate cutoffDate,
        @Param("daysNoSale") int daysNoSale,
        @Param("categoryId") Integer categoryId,
        @Param("search") String search,
        Pageable pageable
    );
}
