package com.pos.finance.repository;

import com.pos.finance.entity.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpenseCategoryRepository extends JpaRepository<ExpenseCategory, UUID> {

    List<ExpenseCategory> findByCompanyIdOrderByNameAsc(Integer companyId);

    Optional<ExpenseCategory> findByCompanyIdAndName(Integer companyId, String name);

    Optional<ExpenseCategory> findByIdAndCompanyId(UUID id, Integer companyId);
}
