package com.pos.repository;

import com.pos.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UnitRepository extends JpaRepository<Unit, String> {

    List<Unit> findByEnabledTrueOrderBySortOrderAscCodeAsc();

    List<Unit> findByEnabledTrueAndStockAllowedTrueOrderBySortOrderAscCodeAsc();

    List<Unit> findByEnabledTrueAndReceiptOnlyTrueOrderBySortOrderAscCodeAsc();
}
