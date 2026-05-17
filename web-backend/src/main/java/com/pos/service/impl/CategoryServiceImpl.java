package com.pos.service.impl;

import com.pos.dto.category.CategoryResponse;
import com.pos.dto.category.CreateCategoryRequest;
import com.pos.dto.category.UpdateCategoryRequest;
import com.pos.entity.Category;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.CategoryMapper;
import com.pos.repository.CategoryRepository;
import com.pos.service.CategoryService;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    @Cacheable(value = "categories", key = "'all'")
    public List<CategoryResponse> findAll() {
        return categoryMapper.toResponseList(categoryRepository.findAll());
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse create(CreateCategoryRequest req) {
        if (categoryRepository.existsByNameIgnoreCase(req.name())) {
            throw new BadRequestException("Category already exists");
        }
        Category cat = Category.builder()
            .name(req.name())
            .description(req.description())
            .build();
        Category saved = categoryRepository.save(cat);
        LogUtil.info(CategoryServiceImpl.class, "Category created: id={}, name={}", saved.getId(), saved.getName());
        return categoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse update(Integer id, UpdateCategoryRequest req) {
        Category cat = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        String name = req.name().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new BadRequestException("Category already exists");
        }
        cat.setName(name);
        cat.setDescription(req.description());
        Category saved = categoryRepository.save(cat);
        LogUtil.info(CategoryServiceImpl.class, "Category updated: id={}", id);
        return categoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public void delete(Integer id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found");
        }
        categoryRepository.deleteById(id);
        LogUtil.info(CategoryServiceImpl.class, "Category deleted: id={}", id);
    }
}
