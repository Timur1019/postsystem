package com.pos.dto.platform.security;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePlatformSuperAdminRequest(
    @NotBlank String firstName,
    @NotBlank String lastName,
    @NotBlank String username,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String password
) {}
