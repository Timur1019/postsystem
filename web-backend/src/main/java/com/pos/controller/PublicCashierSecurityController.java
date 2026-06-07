package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.platform.security.VerifyCashierServerPasswordRequest;
import com.pos.dto.platform.security.VerifyCashierServerPasswordResponse;
import com.pos.service.PlatformSecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/cashier")
@RequiredArgsConstructor
@Tag(name = "Public Cashier Security", description = "Публичные проверки для desktop-кассы")
@StandardApiResponses
public class PublicCashierSecurityController {

    private final PlatformSecurityService platformSecurityService;

    @PostMapping("/server-setup/verify-password")
    @Operation(summary = "Проверить пароль настройки сервера кассы")
    public ResponseEntity<VerifyCashierServerPasswordResponse> verifyServerSetupPassword(
        @Valid @RequestBody VerifyCashierServerPasswordRequest request
    ) {
        return ResponseEntity.ok(platformSecurityService.verifyCashierServerPassword(request.password()));
    }
}
