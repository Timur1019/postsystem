package com.pos.repository;

import com.pos.entity.CashierShift;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CashierShiftRepository extends JpaRepository<CashierShift, UUID> {

    long countByStore_Id(Integer storeId);

    Optional<CashierShift> findByCashierIdAndStoreIdAndStatus(
        UUID cashierId,
        Integer storeId,
        CashierShift.ShiftStatus status
    );

    @EntityGraph(attributePaths = {"store", "store.company", "cashier"})
    @Query("SELECT s FROM CashierShift s WHERE s.status = :status AND s.zReport IS NULL")
    List<CashierShift> findClosedWithoutZReport(@Param("status") CashierShift.ShiftStatus status);

    @EntityGraph(attributePaths = {"store", "store.company", "cashier"})
    @Query("""
        SELECT s FROM CashierShift s
        JOIN s.store st
        WHERE s.status = :status AND s.zReport IS NULL AND st.company.id = :companyId
        """)
    List<CashierShift> findClosedWithoutZReportByCompany(
        @Param("status") CashierShift.ShiftStatus status,
        @Param("companyId") Integer companyId
    );
}
