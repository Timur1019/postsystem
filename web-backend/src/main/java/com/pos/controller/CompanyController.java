package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.company.CompanyResponse;
import com.pos.dto.company.CreateCompanyRequest;
import com.pos.dto.company.UpdateCompanyRequest;
import com.pos.dto.shared.PageResponse;
import com.pos.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/companies")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Companies (SUPER_ADMIN)", description = "Управление компаниями платформы (только SUPER_ADMIN)")
@StandardApiResponses
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    @Operation(summary = "Список компаний", description = "Постраничный список компаний с поиском")
    @ApiResponse(responseCode = "200", description = "Список компаний")
    public ResponseEntity<PageResponse<CompanyResponse>> list(
        @RequestParam(required = false) String search,
        @PageableDefault(size = 14) Pageable pageable
    ) {
        return ResponseEntity.ok(companyService.list(search, pageable));
    }

    @GetMapping("/all")
    @Operation(summary = "Все компании", description = "Полный список компаний без пагинации")
    @ApiResponse(responseCode = "200", description = "Список всех компаний")
    public ResponseEntity<List<CompanyResponse>> listAll() {
        return ResponseEntity.ok(companyService.listAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Компания по ID", description = "Получение компании по идентификатору")
    @ApiResponse(responseCode = "200", description = "Данные компании")
    public ResponseEntity<CompanyResponse> get(@PathVariable Integer id) {
        return ResponseEntity.ok(companyService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Создать компанию", description = "Создание новой компании на платформе")
    @ApiResponse(responseCode = "201", description = "Компания создана")
    public ResponseEntity<CompanyResponse> create(@Valid @RequestBody CreateCompanyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(companyService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить компанию", description = "Изменение данных компании")
    @ApiResponse(responseCode = "200", description = "Компания обновлена")
    public ResponseEntity<CompanyResponse> update(
        @PathVariable Integer id,
        @Valid @RequestBody UpdateCompanyRequest request
    ) {
        return ResponseEntity.ok(companyService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить компанию", description = "Удаление компании по идентификатору")
    @ApiResponse(responseCode = "204", description = "Компания удалена")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        companyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
