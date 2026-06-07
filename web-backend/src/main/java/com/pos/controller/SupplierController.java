package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.supplier.CreateSupplierRequest;
import com.pos.dto.supplier.SupplierResponse;
import com.pos.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/suppliers")
@RequiredArgsConstructor
@Tag(name = "Suppliers", description = "Справочник поставщиков")
@StandardApiResponses
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    @Operation(summary = "Список поставщиков", description = "Постраничный список поставщиков с фильтрами")
    @ApiResponse(responseCode = "200", description = "Список поставщиков")
    public ResponseEntity<PageResponse<SupplierResponse>> list(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdOn,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(supplierService.list(search, createdOn, pageable));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать поставщика", description = "Добавление нового поставщика")
    @ApiResponse(responseCode = "201", description = "Поставщик создан")
    public ResponseEntity<SupplierResponse> create(@Valid @RequestBody CreateSupplierRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.create(request));
    }
}
