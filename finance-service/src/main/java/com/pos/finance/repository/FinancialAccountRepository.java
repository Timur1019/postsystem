package com.pos.finance.repository;

import com.pos.finance.entity.AccountType;
import com.pos.finance.entity.FinancialAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FinancialAccountRepository extends JpaRepository<FinancialAccount, UUID> {

    List<FinancialAccount> findByCompanyIdAndDeletedFalseOrderByNameAsc(Integer companyId);

    Optional<FinancialAccount> findByIdAndCompanyIdAndDeletedFalse(UUID id, Integer companyId);

    Optional<FinancialAccount> findFirstByCompanyIdAndStoreIdAndTypeAndDeletedFalse(
        Integer companyId, Integer storeId, AccountType type
    );

    Optional<FinancialAccount> findFirstByCompanyIdAndStoreIdIsNullAndTypeAndDeletedFalse(
        Integer companyId, AccountType type
    );
}
