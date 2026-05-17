package com.pos.repository;

import com.pos.entity.ProductBarcode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProductBarcodeRepository extends JpaRepository<ProductBarcode, UUID> {

    Optional<ProductBarcode> findByBarcode(String barcode);

    boolean existsByBarcode(String barcode);
}
