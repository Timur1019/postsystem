package com.pos.finance.service;

import com.pos.finance.dto.category.CategoryDto;
import com.pos.finance.dto.category.CreateCategoryRequest;

import java.util.List;
import java.util.UUID;

public interface CategoryService {

    List<CategoryDto> listIncomeCategories();

    List<CategoryDto> listExpenseCategories();

    CategoryDto createIncomeCategory(CreateCategoryRequest request);

    CategoryDto createExpenseCategory(CreateCategoryRequest request);

    CategoryDto toggleIncomeCategory(UUID id, boolean active);

    CategoryDto toggleExpenseCategory(UUID id, boolean active);
}
