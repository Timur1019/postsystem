package com.pos.repository;

import com.pos.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    long countByStore_Id(Integer storeId);
}
