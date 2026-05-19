package com.pos.controller;

import com.pos.dto.access.AdminModuleCatalogItem;
import com.pos.dto.access.UpdateUserModuleAccessRequest;
import com.pos.dto.access.UserModuleAccessDetailResponse;
import com.pos.dto.access.UserModuleAccessSummary;
import com.pos.service.ModuleAccessService;
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
public class PlatformModuleAccessController {

    private final ModuleAccessService moduleAccessService;

    @GetMapping("/catalog")
    public ResponseEntity<List<AdminModuleCatalogItem>> catalog() {
        return ResponseEntity.ok(moduleAccessService.catalog());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserModuleAccessSummary>> listUsers(
        @RequestParam Integer companyId
    ) {
        return ResponseEntity.ok(moduleAccessService.listUsers(companyId));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserModuleAccessDetailResponse> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(moduleAccessService.getUserAccess(userId));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<UserModuleAccessDetailResponse> updateUser(
        @PathVariable UUID userId,
        @Valid @RequestBody UpdateUserModuleAccessRequest request
    ) {
        return ResponseEntity.ok(moduleAccessService.updateUserAccess(userId, request));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<UserModuleAccessDetailResponse> resetUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(moduleAccessService.resetUserAccess(userId));
    }
}
