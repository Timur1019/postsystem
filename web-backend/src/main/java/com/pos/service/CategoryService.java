package com.pos.service;

import com.pos.dto.category.CategoryResponse;
import com.pos.dto.category.CreateCategoryRequest;
import com.pos.dto.category.UpdateCategoryRequest;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> findAll();

    CategoryResponse create(CreateCategoryRequest req);

    CategoryResponse update(Integer id, UpdateCategoryRequest req);

    void delete(Integer id);
}
