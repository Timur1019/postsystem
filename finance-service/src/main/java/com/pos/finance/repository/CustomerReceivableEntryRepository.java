package com.pos.finance.repository;

import com.pos.finance.entity.CustomerReceivableEntry;
import com.pos.finance.entity.LedgerEntryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomerReceivableEntryRepository extends JpaRepository<CustomerReceivableEntry, UUID> {

    Optional<CustomerReceivableEntry> findByCompanyIdAndSourceId(Integer companyId, String sourceId);

    @Query("""
        SELECT e.customerId, MAX(e.customerName), SUM(
            CASE WHEN e.entryType = com.pos.finance.entity.LedgerEntryType.CHARGE THEN e.amount
                 ELSE -e.amount END)
        FROM CustomerReceivableEntry e
        WHERE e.companyId = :companyId
        GROUP BY e.customerId
        HAVING SUM(CASE WHEN e.entryType = com.pos.finance.entity.LedgerEntryType.CHARGE THEN e.amount
                        ELSE -e.amount END) > 0
        ORDER BY MAX(e.customerName)
        """)
    List<Object[]> sumBalancesByCustomer(@Param("companyId") Integer companyId);

    List<CustomerReceivableEntry> findByCompanyIdAndCustomerIdOrderByTransactionDateDescCreatedAtDesc(
        Integer companyId, UUID customerId
    );

    @Query("""
        SELECT COALESCE(SUM(
            CASE WHEN e.entryType = :charge THEN e.amount ELSE -e.amount END), 0)
        FROM CustomerReceivableEntry e
        WHERE e.companyId = :companyId AND e.customerId = :customerId
        """)
    java.math.BigDecimal balanceForCustomer(
        @Param("companyId") Integer companyId,
        @Param("customerId") UUID customerId,
        @Param("charge") LedgerEntryType charge
    );
}
