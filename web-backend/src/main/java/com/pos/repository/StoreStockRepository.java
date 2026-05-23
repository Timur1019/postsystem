package com.pos.repository;

import com.pos.entity.StoreStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StoreStockRepository extends JpaRepository<StoreStock, UUID> {

    Optional<StoreStock> findByProductIdAndStoreId(UUID productId, Integer storeId);

    List<StoreStock> findByProductIdInAndStoreId(Collection<UUID> productIds, Integer storeId);

    @Query("""
        SELECT COALESCE(SUM(ss.quantity), 0)
        FROM StoreStock ss
        JOIN ss.store st
        WHERE ss.product.id = :productId AND st.company.id = :companyId
        """)
    int sumQuantityByProductAndCompany(@Param("productId") UUID productId, @Param("companyId") Integer companyId);

    @Query("""
        SELECT ss.product.id, ss.quantity
        FROM StoreStock ss
        WHERE ss.store.id = :storeId AND ss.product.id IN :productIds
        """)
    List<Object[]> quantitiesByStoreAndProductIds(
        @Param("storeId") Integer storeId,
        @Param("productIds") Collection<UUID> productIds
    );
}
