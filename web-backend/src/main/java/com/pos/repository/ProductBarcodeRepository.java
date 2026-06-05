package com.pos.repository;

import com.pos.entity.ProductBarcode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ProductBarcodeRepository extends JpaRepository<ProductBarcode, UUID> {

    Optional<ProductBarcode> findByBarcode(String barcode);

    boolean existsByBarcode(String barcode);

    @Query("""
        SELECT pb FROM ProductBarcode pb
        WHERE pb.barcode = :barcode AND pb.product.company.id = :companyId
        """)
    Optional<ProductBarcode> findByBarcodeAndProductCompanyId(
        @Param("barcode") String barcode,
        @Param("companyId") Integer companyId
    );
}
