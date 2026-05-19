package com.pos.repository;

import com.pos.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
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
}
