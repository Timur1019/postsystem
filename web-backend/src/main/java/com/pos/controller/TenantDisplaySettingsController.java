package com.pos.controller;

import com.pos.dto.tenant.TenantDisplaySettingsPayload;
import com.pos.service.TenantDisplaySettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tenant-display-settings")
@RequiredArgsConstructor
public class TenantDisplaySettingsController {

    private final TenantDisplaySettingsService tenantDisplaySettingsService;

    @GetMapping
    public ResponseEntity<TenantDisplaySettingsPayload> get() {
        return ResponseEntity.ok(tenantDisplaySettingsService.getForCurrentCompany());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TenantDisplaySettingsPayload> save(@RequestBody TenantDisplaySettingsPayload payload) {
        return ResponseEntity.ok(tenantDisplaySettingsService.saveForCurrentCompany(payload));
    }
}
