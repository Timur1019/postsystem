package com.pos.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateUserRequest(
    String firstName,
    String lastName,
    String patronymic,
    String fullName,
    @Email String email,
    @Size(min = 6, message = "Password must be at least 6 characters") String password,
    String role,
    Integer companyId,
    List<Integer> storeIds
) {}
