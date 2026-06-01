package com.pos.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record VerifyPinRequest(@NotBlank String pin) {}

