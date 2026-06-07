package com.pos.dto.user;

import java.util.List;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String username,
    String email,
    String firstName,
    String lastName,
    String patronymic,
    String fullName,
    String role,
    Integer companyId,
    String companyName,
    String companyLoginCode,
    List<Integer> storeIds,
    List<String> storeNames,
    boolean active
) {}
