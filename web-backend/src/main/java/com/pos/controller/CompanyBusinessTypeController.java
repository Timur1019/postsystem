package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.company.CompanyBusinessTypeResponse;
import com.pos.service.CompanyBusinessTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/company-business-type")
@RequiredArgsConstructor
@Tag(name = "Company Business Type", description = "Тип бизнеса компании (значение по умолчанию для новых магазинов)")
@StandardApiResponses
public class CompanyBusinessTypeController {

    private final CompanyBusinessTypeService companyBusinessTypeService;

    @GetMapping
    @Operation(summary = "Получить тип бизнеса", description = "Текущий тип бизнеса компании")
    @ApiResponse(responseCode = "200", description = "Тип бизнеса")
    public ResponseEntity<CompanyBusinessTypeResponse> get() {
        return ResponseEntity.ok(companyBusinessTypeService.getForCurrentCompany());
    }
}
