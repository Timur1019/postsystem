package com.pos.service.impl;

import com.pos.dto.category.CategoryResponse;
import com.pos.dto.category.CreateCategoryRequest;
import com.pos.dto.category.UpdateCategoryRequest;
import com.pos.entity.Category;
import com.pos.entity.Company;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.CategoryMapper;
import com.pos.repository.CategoryRepository;
import com.pos.service.CategoryService;
import com.pos.service.support.TenantAccessSupport;
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
    private final TenantAccessSupport tenantAccess;

    @Override
    @Cacheable(value = "categories", key = "@tenantCacheKeyResolver.categories()")
    public List<CategoryResponse> findAll() {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        return categoryMapper.toResponseList(categoryRepository.findByCompanyIdOrderByNameAsc(companyId));
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", key = "@tenantCacheKeyResolver.categoriesForCurrentUser()")
    public CategoryResponse create(CreateCategoryRequest req) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        if (categoryRepository.existsByNameIgnoreCaseAndCompanyId(req.name(), companyId)) {
            throw new BadRequestException("Category already exists");
        }
        Company company = tenantAccess.requireCompany(companyId);
        Category cat = Category.builder()
            .company(company)
            .name(req.name())
            .description(req.description())
            .build();
        Category saved = categoryRepository.save(cat);
        LogUtil.info(CategoryServiceImpl.class, "Category created: id={}, name={}", saved.getId(), saved.getName());
        return categoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", key = "@tenantCacheKeyResolver.categoriesForCurrentUser()")
    public CategoryResponse update(Integer id, UpdateCategoryRequest req) {
        Category cat = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        tenantAccess.assertCanAccessCompany(cat.getCompany().getId());
        String name = req.name().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndCompanyIdAndIdNot(name, cat.getCompany().getId(), id)) {
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
    @CacheEvict(value = "categories", key = "@tenantCacheKeyResolver.categoriesForCurrentUser()")
    public void delete(Integer id) {
        Category cat = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        tenantAccess.assertCanAccessCompany(cat.getCompany().getId());
        categoryRepository.delete(cat);
        LogUtil.info(CategoryServiceImpl.class, "Category deleted: id={}", id);
    }
}
