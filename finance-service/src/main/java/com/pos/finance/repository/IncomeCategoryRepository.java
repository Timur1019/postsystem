package com.pos.finance.repository;

import com.pos.finance.entity.IncomeCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IncomeCategoryRepository extends JpaRepository<IncomeCategory, UUID> {

    List<IncomeCategory> findByCompanyIdOrderByNameAsc(Integer companyId);

    Optional<IncomeCategory> findByCompanyIdAndName(Integer companyId, String name);

    Optional<IncomeCategory> findByIdAndCompanyId(UUID id, Integer companyId);
}
