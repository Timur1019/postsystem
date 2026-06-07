package com.pos.dto.platform.security;

import jakarta.validation.constraints.Size;

public record UpdatePlatformSuperAdminRequest(
    String firstName,
    String lastName,
    @Size(min = 6, message = "Password must be at least 6 characters") String password
) {}
