package com.pos.finance.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            if (!request.getRequestURI().contains("/internal/")) {
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    if (jwtService.isTokenValid(token)) {
                        Integer companyId = resolveCompanyId(request, token);
                        UUID userId = jwtService.extractUserId(token);
                        String role = request.getHeader("X-User-Roles");
                        if (role == null || role.isBlank()) {
                            role = jwtService.extractRole(token);
                        }
                        FinanceTenantContext.set(companyId, userId, role);
                    }
                }
            }
            filterChain.doFilter(request, response);
        } finally {
            FinanceTenantContext.clear();
        }
    }

    private Integer resolveCompanyId(HttpServletRequest request, String token) {
        Integer companyId = jwtService.extractCompanyId(token);
        if (companyId != null) {
            return companyId;
        }
        String headerValue = request.getHeader("X-Company-Id");
        if (headerValue == null || headerValue.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(headerValue.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
