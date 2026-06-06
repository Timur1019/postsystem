package com.pos.controller;

import com.pos.dto.company.CompanyBusinessTypeResponse;
import com.pos.dto.company.UpdateCompanyBusinessTypeRequest;
import com.pos.service.CompanyBusinessTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/company-business-type")
@RequiredArgsConstructor
public class CompanyBusinessTypeController {

    private final CompanyBusinessTypeService companyBusinessTypeService;

    @GetMapping
    public ResponseEntity<CompanyBusinessTypeResponse> get() {
        return ResponseEntity.ok(companyBusinessTypeService.getForCurrentCompany());
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CompanyBusinessTypeResponse> save(
        @Valid @RequestBody UpdateCompanyBusinessTypeRequest request
    ) {
        return ResponseEntity.ok(companyBusinessTypeService.saveForCurrentCompany(request));
    }
}
