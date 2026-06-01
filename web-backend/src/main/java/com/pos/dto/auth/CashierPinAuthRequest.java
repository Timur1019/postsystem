package com.pos.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record CashierPinAuthRequest(
    @NotBlank String companyLoginCode,
    @NotBlank String pin
) {}

