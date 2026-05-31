package com.pos.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record AuthRequest(
    String companyLoginCode,
    @NotBlank String username,
    @NotBlank String password
) {}
