package com.pos.controller;

import com.pos.dto.auth.AuthRequest;
import com.pos.dto.auth.AuthResponse;
import com.pos.dto.auth.CashierPinAuthRequest;
import com.pos.dto.auth.RegisterRequest;
import com.pos.dto.auth.VerifyPinRequest;
import com.pos.dto.auth.VerifyPasswordRequest;
import com.pos.service.AuthService;
import com.pos.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
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
    public ResponseEntity<AuthResponse> cashierPinLogin(@Valid @RequestBody CashierPinAuthRequest request) {
        return ResponseEntity.ok(authService.authenticateCashierPin(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestHeader("Authorization") String bearerToken) {
        return ResponseEntity.ok(authService.refreshToken(bearerToken.substring(7)));
    }

    @PostMapping("/verify-password")
    public ResponseEntity<Void> verifyPassword(@Valid @RequestBody VerifyPasswordRequest request) {
        authService.verifyPassword(request.password());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify-pin")
    public ResponseEntity<Void> verifyPin(@Valid @RequestBody VerifyPinRequest request) {
        authService.verifyPin(request.pin());
        return ResponseEntity.noContent().build();
    }
}
