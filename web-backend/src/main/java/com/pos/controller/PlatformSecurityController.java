package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.platform.security.CashierServerPasswordStatusResponse;
import com.pos.dto.platform.security.CreatePlatformSuperAdminRequest;
import com.pos.dto.platform.security.PlatformSuperAdminResponse;
import com.pos.dto.platform.security.UpdateCashierServerPasswordRequest;
import com.pos.dto.platform.security.UpdatePlatformSuperAdminRequest;
import com.pos.service.PlatformSecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/platform/security")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Platform Security", description = "Безопасность платформы: пароль кассы, супер-админы")
@StandardApiResponses
public class PlatformSecurityController {

    private final PlatformSecurityService platformSecurityService;

    @GetMapping("/cashier-server-password")
    @Operation(summary = "Статус пароля настройки сервера кассы")
    public ResponseEntity<CashierServerPasswordStatusResponse> getCashierServerPassword() {
        return ResponseEntity.ok(platformSecurityService.getCashierServerPasswordStatus());
    }

    @PutMapping("/cashier-server-password")
    @Operation(summary = "Задать пароль настройки сервера кассы")
    public ResponseEntity<CashierServerPasswordStatusResponse> updateCashierServerPassword(
        @Valid @RequestBody UpdateCashierServerPasswordRequest request
    ) {
        return ResponseEntity.ok(platformSecurityService.updateCashierServerPassword(request));
    }

    @GetMapping("/super-admins")
    @Operation(summary = "Список супер-администраторов платформы")
    public ResponseEntity<List<PlatformSuperAdminResponse>> listSuperAdmins() {
        return ResponseEntity.ok(platformSecurityService.listSuperAdmins());
    }

    @PostMapping("/super-admins")
    @Operation(summary = "Создать супер-администратора")
    public ResponseEntity<PlatformSuperAdminResponse> createSuperAdmin(
        @Valid @RequestBody CreatePlatformSuperAdminRequest request
    ) {
        return ResponseEntity.ok(platformSecurityService.createSuperAdmin(request));
    }

    @PutMapping("/super-admins/{id}")
    @Operation(summary = "Обновить супер-администратора")
    public ResponseEntity<PlatformSuperAdminResponse> updateSuperAdmin(
        @PathVariable UUID id,
        @Valid @RequestBody UpdatePlatformSuperAdminRequest request
    ) {
        return ResponseEntity.ok(platformSecurityService.updateSuperAdmin(id, request));
    }
}
