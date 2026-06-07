package com.pos.dto.platform.security;

import jakarta.validation.constraints.NotBlank;

public record VerifyCashierServerPasswordRequest(
    @NotBlank String password
) {}
