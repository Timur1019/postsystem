package com.pos.finance.controller;

import com.pos.finance.dto.category.CategoryDto;
import com.pos.finance.dto.category.CreateCategoryRequest;
import com.pos.finance.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/finance/categories")
@RequiredArgsConstructor
@Tag(name = "Finance Categories", description = "Категории доходов и расходов")
public class FinanceCategoryController {

    private final CategoryService categoryService;

    @GetMapping("/income")
    @Operation(summary = "Категории доходов")
    public ResponseEntity<List<CategoryDto>> incomeCategories() {
        return ResponseEntity.ok(categoryService.listIncomeCategories());
    }

    @GetMapping("/expense")
    @Operation(summary = "Категории расходов")
    public ResponseEntity<List<CategoryDto>> expenseCategories() {
        return ResponseEntity.ok(categoryService.listExpenseCategories());
    }

    @PostMapping("/income")
    @Operation(summary = "Создать категорию дохода")
    public ResponseEntity<CategoryDto> createIncome(@Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createIncomeCategory(request));
    }

    @PostMapping("/expense")
    @Operation(summary = "Создать категорию расхода")
    public ResponseEntity<CategoryDto> createExpense(@Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createExpenseCategory(request));
    }

    @PatchMapping("/income/{id}")
    @Operation(summary = "Включить/отключить категорию дохода")
    public ResponseEntity<CategoryDto> toggleIncome(@PathVariable UUID id, @RequestParam boolean active) {
        return ResponseEntity.ok(categoryService.toggleIncomeCategory(id, active));
    }

    @PatchMapping("/expense/{id}")
    @Operation(summary = "Включить/отключить категорию расхода")
    public ResponseEntity<CategoryDto> toggleExpense(@PathVariable UUID id, @RequestParam boolean active) {
        return ResponseEntity.ok(categoryService.toggleExpenseCategory(id, active));
    }
}
