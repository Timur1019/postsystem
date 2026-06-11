package com.pos.controller;

import com.pos.entity.User;
import com.pos.service.finance.support.FinanceHttpClient;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/finance")
@RequiredArgsConstructor
@Hidden
public class FinanceGatewayController {

    private final FinanceHttpClient financeHttpClient;

    @RequestMapping(value = "/**", method = {
        RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
        RequestMethod.PATCH, RequestMethod.DELETE
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<String> proxy(
        HttpServletRequest request,
        @RequestBody(required = false) String body,
        @AuthenticationPrincipal User user
    ) {
        String authHeader = request.getHeader("Authorization");
        return financeHttpClient.forwardUserRequest(request, body, user, authHeader);
    }
}
