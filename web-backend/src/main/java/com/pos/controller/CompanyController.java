package com.pos.controller;

import com.pos.dto.company.CompanyResponse;
import com.pos.dto.company.CreateCompanyRequest;
import com.pos.dto.company.UpdateCompanyRequest;
import com.pos.dto.shared.PageResponse;
import com.pos.service.CompanyService;
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
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    public ResponseEntity<PageResponse<CompanyResponse>> list(
        @RequestParam(required = false) String search,
        @PageableDefault(size = 14) Pageable pageable
    ) {
        return ResponseEntity.ok(companyService.list(search, pageable));
    }

    @GetMapping("/all")
    public ResponseEntity<List<CompanyResponse>> listAll() {
        return ResponseEntity.ok(companyService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyResponse> get(@PathVariable Integer id) {
        return ResponseEntity.ok(companyService.getById(id));
    }

    @PostMapping
    public ResponseEntity<CompanyResponse> create(@Valid @RequestBody CreateCompanyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(companyService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompanyResponse> update(
        @PathVariable Integer id,
        @Valid @RequestBody UpdateCompanyRequest request
    ) {
        return ResponseEntity.ok(companyService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        companyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
