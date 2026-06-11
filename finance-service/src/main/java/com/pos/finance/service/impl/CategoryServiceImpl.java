package com.pos.finance.service.impl;

import com.pos.finance.dto.category.CategoryDto;
import com.pos.finance.dto.category.CreateCategoryRequest;
import com.pos.finance.entity.ExpenseCategory;
import com.pos.finance.entity.IncomeCategory;
import com.pos.finance.exception.FinanceExceptions;
import com.pos.finance.mapper.FinanceMapper;
import com.pos.finance.repository.ExpenseCategoryRepository;
import com.pos.finance.repository.IncomeCategoryRepository;
import com.pos.finance.security.FinanceTenantContext;
import com.pos.finance.service.CategoryService;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final IncomeCategoryRepository incomeCategoryRepository;
    private final ExpenseCategoryRepository expenseCategoryRepository;
    private final FinanceMapper mapper;
    private final CompanyBootstrapSupport bootstrapSupport;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> listIncomeCategories() {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        return incomeCategoryRepository.findByCompanyIdOrderByNameAsc(companyId).stream()
            .map(mapper::toDto)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> listExpenseCategories() {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        return expenseCategoryRepository.findByCompanyIdOrderByNameAsc(companyId).stream()
            .map(mapper::toDto)
            .toList();
    }

    @Override
    public CategoryDto createIncomeCategory(CreateCategoryRequest request) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        IncomeCategory category = IncomeCategory.builder()
            .companyId(companyId)
            .name(request.name().trim())
            .type("INCOME")
            .system(false)
            .active(true)
            .build();
        return mapper.toDto(incomeCategoryRepository.save(category));
    }

    @Override
    public CategoryDto createExpenseCategory(CreateCategoryRequest request) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        ExpenseCategory category = ExpenseCategory.builder()
            .companyId(companyId)
            .name(request.name().trim())
            .type("EXPENSE")
            .system(false)
            .active(true)
            .build();
        return mapper.toDto(expenseCategoryRepository.save(category));
    }

    @Override
    public CategoryDto toggleIncomeCategory(UUID id, boolean active) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        IncomeCategory category = incomeCategoryRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> FinanceExceptions.notFound("IncomeCategory", id));
        category.setActive(active);
        return mapper.toDto(incomeCategoryRepository.save(category));
    }

    @Override
    public CategoryDto toggleExpenseCategory(UUID id, boolean active) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        ExpenseCategory category = expenseCategoryRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> FinanceExceptions.notFound("ExpenseCategory", id));
        category.setActive(active);
        return mapper.toDto(expenseCategoryRepository.save(category));
    }
}
