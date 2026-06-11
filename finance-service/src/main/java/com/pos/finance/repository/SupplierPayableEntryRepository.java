package com.pos.finance.repository;

import com.pos.finance.entity.LedgerEntryType;
import com.pos.finance.entity.SupplierPayableEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupplierPayableEntryRepository extends JpaRepository<SupplierPayableEntry, UUID> {

    Optional<SupplierPayableEntry> findByCompanyIdAndSourceId(Integer companyId, String sourceId);

    @Query("""
        SELECT e.supplierId, MAX(e.supplierName), SUM(
            CASE WHEN e.entryType = com.pos.finance.entity.LedgerEntryType.CHARGE THEN e.amount
                 ELSE -e.amount END)
        FROM SupplierPayableEntry e
        WHERE e.companyId = :companyId
        GROUP BY e.supplierId
        HAVING SUM(CASE WHEN e.entryType = com.pos.finance.entity.LedgerEntryType.CHARGE THEN e.amount
                        ELSE -e.amount END) > 0
        ORDER BY MAX(e.supplierName)
        """)
    List<Object[]> sumBalancesBySupplier(@Param("companyId") Integer companyId);

    List<SupplierPayableEntry> findByCompanyIdAndSupplierIdOrderByTransactionDateDescCreatedAtDesc(
        Integer companyId, UUID supplierId
    );

    @Query("""
        SELECT COALESCE(SUM(
            CASE WHEN e.entryType = :charge THEN e.amount ELSE -e.amount END), 0)
        FROM SupplierPayableEntry e
        WHERE e.companyId = :companyId AND e.supplierId = :supplierId
        """)
    java.math.BigDecimal balanceForSupplier(
        @Param("companyId") Integer companyId,
        @Param("supplierId") UUID supplierId,
        @Param("charge") LedgerEntryType charge
    );
}
