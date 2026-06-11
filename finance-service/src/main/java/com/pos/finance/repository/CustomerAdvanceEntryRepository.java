package com.pos.finance.repository;

import com.pos.finance.entity.AdvanceEntryType;
import com.pos.finance.entity.CustomerAdvanceEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomerAdvanceEntryRepository extends JpaRepository<CustomerAdvanceEntry, UUID> {

    Optional<CustomerAdvanceEntry> findByCompanyIdAndSourceId(Integer companyId, String sourceId);

    List<CustomerAdvanceEntry> findByCompanyIdAndCustomerIdOrderByTransactionDateDescCreatedAtDesc(
        Integer companyId, UUID customerId
    );

    @Query("""
        SELECT e.customerId, MAX(e.customerName), SUM(
            CASE WHEN e.entryType = com.pos.finance.entity.AdvanceEntryType.DEPOSIT THEN e.amount
                 ELSE -e.amount END)
        FROM CustomerAdvanceEntry e
        WHERE e.companyId = :companyId
        GROUP BY e.customerId
        HAVING SUM(CASE WHEN e.entryType = com.pos.finance.entity.AdvanceEntryType.DEPOSIT THEN e.amount
                        ELSE -e.amount END) > 0
        ORDER BY MAX(e.customerName)
        """)
    List<Object[]> sumBalancesByCustomer(@Param("companyId") Integer companyId);

    @Query("""
        SELECT COALESCE(SUM(
            CASE WHEN e.entryType = :deposit THEN e.amount ELSE -e.amount END), 0)
        FROM CustomerAdvanceEntry e
        WHERE e.companyId = :companyId AND e.customerId = :customerId
        """)
    BigDecimal balanceForCustomer(
        @Param("companyId") Integer companyId,
        @Param("customerId") UUID customerId,
        @Param("deposit") AdvanceEntryType deposit
    );
}
