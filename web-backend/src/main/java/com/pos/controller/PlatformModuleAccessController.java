package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.access.AdminModuleCatalogItem;
import com.pos.dto.access.UpdateUserModuleAccessRequest;
import com.pos.dto.access.UserModuleAccessDetailResponse;
import com.pos.dto.access.UserModuleAccessSummary;
import com.pos.service.ModuleAccessService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/platform/module-access")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Platform Module Access", description = "Управление доступом к модулям (SUPER_ADMIN)")
@StandardApiResponses
public class PlatformModuleAccessController {

    private final ModuleAccessService moduleAccessService;

    @GetMapping("/catalog")
    @Operation(summary = "Каталог модулей", description = "Список модулей, доступных для назначения")
    @ApiResponse(responseCode = "200", description = "Каталог модулей")
    public ResponseEntity<List<AdminModuleCatalogItem>> catalog() {
        return ResponseEntity.ok(moduleAccessService.catalog());
    }

    @GetMapping("/users")
    @Operation(summary = "Пользователи компании", description = "Сводка доступа к модулям по пользователям компании")
    @ApiResponse(responseCode = "200", description = "Список пользователей")
    public ResponseEntity<List<UserModuleAccessSummary>> listUsers(
        @RequestParam Integer companyId
    ) {
        return ResponseEntity.ok(moduleAccessService.listUsers(companyId));
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Доступ пользователя", description = "Детальная информация о доступе пользователя к модулям")
    @ApiResponse(responseCode = "200", description = "Доступ пользователя")
    public ResponseEntity<UserModuleAccessDetailResponse> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(moduleAccessService.getUserAccess(userId));
    }

    @PutMapping("/users/{userId}")
    @Operation(summary = "Обновить доступ", description = "Изменение набора модулей, доступных пользователю")
    @ApiResponse(responseCode = "200", description = "Доступ обновлён")
    public ResponseEntity<UserModuleAccessDetailResponse> updateUser(
        @PathVariable UUID userId,
        @Valid @RequestBody UpdateUserModuleAccessRequest request
    ) {
        return ResponseEntity.ok(moduleAccessService.updateUserAccess(userId, request));
    }

    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Сбросить доступ", description = "Сброс индивидуального доступа к модулям (к значениям по умолчанию)")
    @ApiResponse(responseCode = "200", description = "Доступ сброшен")
    public ResponseEntity<UserModuleAccessDetailResponse> resetUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(moduleAccessService.resetUserAccess(userId));
    }
}
