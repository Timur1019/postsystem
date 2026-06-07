package com.pos.dto.platform.security;

import java.util.UUID;

public record PlatformSuperAdminResponse(
    UUID id,
    String username,
    String email,
    String firstName,
    String lastName,
    String fullName,
    boolean active
) {}
