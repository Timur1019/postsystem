package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.tenant.TenantDisplaySettingsPayload;
import com.pos.service.TenantDisplaySettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tenant-display-settings")
@RequiredArgsConstructor
@Tag(name = "Tenant Display Settings", description = "Настройки отображения интерфейса для компании")
@StandardApiResponses
public class TenantDisplaySettingsController {

    private final TenantDisplaySettingsService tenantDisplaySettingsService;

    @GetMapping
    @Operation(summary = "Получить настройки", description = "Текущие настройки отображения компании")
    @ApiResponse(responseCode = "200", description = "Настройки отображения")
    public ResponseEntity<TenantDisplaySettingsPayload> get() {
        return ResponseEntity.ok(tenantDisplaySettingsService.getForCurrentCompany());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Сохранить настройки", description = "Обновление настроек отображения компании")
    @ApiResponse(responseCode = "200", description = "Настройки сохранены")
    public ResponseEntity<TenantDisplaySettingsPayload> save(@RequestBody TenantDisplaySettingsPayload payload) {
        return ResponseEntity.ok(tenantDisplaySettingsService.saveForCurrentCompany(payload));
    }
}
