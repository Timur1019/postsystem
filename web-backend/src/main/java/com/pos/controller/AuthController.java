package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.auth.AuthRequest;
import com.pos.dto.auth.AuthResponse;
import com.pos.dto.auth.CashierPinAuthRequest;
import com.pos.dto.auth.RegisterRequest;
import com.pos.dto.auth.VerifyPinRequest;
import com.pos.dto.auth.VerifyPasswordRequest;
import com.pos.service.AuthService;
import com.pos.util.ClientIpResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Аутентификация, регистрация и проверка учётных данных")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Вход в систему", description = "Аутентификация по логину и паролю, выдача JWT-токенов")
    @SecurityRequirements()
    @ApiResponse(responseCode = "200", description = "Успешная аутентификация")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody AuthRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(authService.authenticate(
            request,
            ClientIpResolver.resolve(httpRequest),
            httpRequest.getHeader("User-Agent")
        ));
    }

    @PostMapping("/cashier-pin/login")
    @Operation(summary = "Вход кассира по PIN", description = "Аутентификация кассира по PIN-коду без пароля")
    @SecurityRequirements()
    @ApiResponse(responseCode = "200", description = "Успешная аутентификация кассира")
    public ResponseEntity<AuthResponse> cashierPinLogin(@Valid @RequestBody CashierPinAuthRequest request) {
        return ResponseEntity.ok(authService.authenticateCashierPin(request));
    }

    @PostMapping("/register")
    @Operation(summary = "Регистрация", description = "Создание нового пользователя и выдача JWT-токенов")
    @SecurityRequirements()
    @ApiResponse(responseCode = "200", description = "Пользователь зарегистрирован")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Обновление токена", description = "Обновление access-токена по refresh-токену из заголовка Authorization")
    @SecurityRequirements()
    @ApiResponse(responseCode = "200", description = "Токены обновлены")
    public ResponseEntity<AuthResponse> refresh(@RequestHeader("Authorization") String bearerToken) {
        return ResponseEntity.ok(authService.refreshToken(bearerToken.substring(7)));
    }

    @PostMapping("/verify-password")
    @Operation(summary = "Проверка пароля", description = "Подтверждение пароля текущего авторизованного пользователя")
    @StandardApiResponses
    @ApiResponse(responseCode = "204", description = "Пароль подтверждён")
    public ResponseEntity<Void> verifyPassword(@Valid @RequestBody VerifyPasswordRequest request) {
        authService.verifyPassword(request.password());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify-pin")
    @Operation(summary = "Проверка PIN", description = "Подтверждение PIN-кода текущего авторизованного пользователя")
    @StandardApiResponses
    @ApiResponse(responseCode = "204", description = "PIN подтверждён")
    public ResponseEntity<Void> verifyPin(@Valid @RequestBody VerifyPinRequest request) {
        authService.verifyPin(request.pin());
        return ResponseEntity.noContent().build();
    }
}
