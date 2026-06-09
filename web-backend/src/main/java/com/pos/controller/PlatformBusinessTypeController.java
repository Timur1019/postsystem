package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.business.*;
import com.pos.service.BusinessTypeDefinitionService;
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
@RequestMapping("/platform/business-types")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Platform Business Types", description = "Конструктор бизнеса: типы и поля товара")
@StandardApiResponses
public class PlatformBusinessTypeController {

    private final BusinessTypeDefinitionService businessTypeDefinitionService;

    @GetMapping
    @Operation(summary = "Список типов бизнеса")
    public ResponseEntity<List<BusinessTypeResponse>> list() {
        return ResponseEntity.ok(businessTypeDefinitionService.list());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Тип бизнеса с полями")
    public ResponseEntity<BusinessTypeDetailResponse> get(@PathVariable Integer id) {
        return ResponseEntity.ok(businessTypeDefinitionService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Создать тип бизнеса")
    public ResponseEntity<BusinessTypeDetailResponse> create(@Valid @RequestBody SaveBusinessTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(businessTypeDefinitionService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить тип бизнеса")
    public ResponseEntity<BusinessTypeDetailResponse> update(
        @PathVariable Integer id,
        @Valid @RequestBody UpdateBusinessTypeRequest request
    ) {
        return ResponseEntity.ok(businessTypeDefinitionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить тип бизнеса")
    public ResponseEntity<com.pos.dto.shared.ApiResponse> delete(@PathVariable Integer id) {
        businessTypeDefinitionService.delete(id);
        return ResponseEntity.ok(com.pos.dto.shared.ApiResponse.success("Business type deleted"));
    }

    @PostMapping("/{id}/fields")
    @Operation(summary = "Добавить поле")
    public ResponseEntity<BusinessTypeFieldResponse> addField(
        @PathVariable Integer id,
        @Valid @RequestBody SaveBusinessTypeFieldRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(businessTypeDefinitionService.addField(id, request));
    }

    @PutMapping("/{typeId}/fields/{fieldId}")
    @Operation(summary = "Обновить поле")
    public ResponseEntity<BusinessTypeFieldResponse> updateField(
        @PathVariable Integer typeId,
        @PathVariable Integer fieldId,
        @Valid @RequestBody UpdateBusinessTypeFieldRequest request
    ) {
        return ResponseEntity.ok(businessTypeDefinitionService.updateField(typeId, fieldId, request));
    }

    @DeleteMapping("/{typeId}/fields/{fieldId}")
    @Operation(summary = "Удалить поле")
    public ResponseEntity<com.pos.dto.shared.ApiResponse> deleteField(
        @PathVariable Integer typeId,
        @PathVariable Integer fieldId
    ) {
        businessTypeDefinitionService.deleteField(typeId, fieldId);
        return ResponseEntity.ok(com.pos.dto.shared.ApiResponse.success("Field deleted"));
    }
}
