package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.category.CategoryResponse;
import com.pos.dto.category.CreateCategoryRequest;
import com.pos.dto.category.UpdateCategoryRequest;
import com.pos.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Справочник категорий товаров")
@StandardApiResponses
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Список категорий", description = "Получение всех категорий товаров")
    @ApiResponse(responseCode = "200", description = "Список категорий")
    public ResponseEntity<List<CategoryResponse>> list() {
        return ResponseEntity.ok(categoryService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать категорию", description = "Добавление новой категории товаров")
    @ApiResponse(responseCode = "201", description = "Категория создана")
    public ResponseEntity<CategoryResponse> create(@Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить категорию", description = "Изменение данных категории")
    @ApiResponse(responseCode = "200", description = "Категория обновлена")
    public ResponseEntity<CategoryResponse> update(
        @PathVariable Integer id,
        @Valid @RequestBody UpdateCategoryRequest request
    ) {
        return ResponseEntity.ok(categoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Удалить категорию", description = "Удаление категории по идентификатору")
    @ApiResponse(responseCode = "200", description = "Категория удалена")
    public ResponseEntity<com.pos.dto.shared.ApiResponse> delete(@PathVariable Integer id) {
        categoryService.delete(id);
        return ResponseEntity.ok(com.pos.dto.shared.ApiResponse.success("Category deleted"));
    }
}
