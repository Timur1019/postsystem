package com.pos.service;

import com.pos.dto.auth.AuthRequest;
import com.pos.dto.auth.AuthResponse;
import com.pos.dto.auth.CashierPinAuthRequest;
import com.pos.dto.auth.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse authenticate(AuthRequest request, String clientIp, String userAgent);

    AuthResponse authenticateCashierPin(CashierPinAuthRequest request);

    AuthResponse refreshToken(String token);

    void verifyPassword(String password);

    void verifyPin(String pin);
}
