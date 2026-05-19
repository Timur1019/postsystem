package com.pos.dto.auth;

import java.util.List;

public record AuthResponse(
    String token,
    String id,
    String username,
    String email,
    String firstName,
    String lastName,
    String patronymic,
    String fullName,
    String role,
    Integer companyId,
    List<Integer> storeIds,
    List<String> allowedModules,
    boolean moduleAccessCustom
) {}
