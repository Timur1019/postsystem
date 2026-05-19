package com.pos.dto.access;

import java.util.List;
import java.util.UUID;

public record UserModuleAccessDetailResponse(
    UUID userId,
    String username,
    String fullName,
    String role,
    boolean moduleAccessCustom,
    List<UserModuleAccessRow> modules
) {}
