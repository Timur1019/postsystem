package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.company.CompanyBusinessTypeResponse;
import com.pos.dto.company.UpdateCompanyBusinessTypeRequest;
import com.pos.service.CompanyBusinessTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/company-business-type")
@RequiredArgsConstructor
@Tag(name = "Company Business Type", description = "Тип бизнеса компании и связанные настройки каталога")
@StandardApiResponses
public class CompanyBusinessTypeController {

    private final CompanyBusinessTypeService companyBusinessTypeService;

    @GetMapping
    @Operation(summary = "Получить тип бизнеса", description = "Текущий тип бизнеса компании")
    @ApiResponse(responseCode = "200", description = "Тип бизнеса")
    public ResponseEntity<CompanyBusinessTypeResponse> get() {
        return ResponseEntity.ok(companyBusinessTypeService.getForCurrentCompany());
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Сохранить тип бизнеса", description = "Обновление типа бизнеса компании")
    @ApiResponse(responseCode = "200", description = "Тип бизнеса сохранён")
    public ResponseEntity<CompanyBusinessTypeResponse> save(
        @Valid @RequestBody UpdateCompanyBusinessTypeRequest request
    ) {
        return ResponseEntity.ok(companyBusinessTypeService.saveForCurrentCompany(request));
    }
}
