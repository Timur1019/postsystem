package com.pos.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateUserRequest(
    String firstName,
    String lastName,
    String patronymic,
    String fullName,
    @NotBlank String username,
    @NotBlank @Email String email,
    @Size(min = 6, message = "Password must be at least 6 characters") String password,
    /** Cashier PIN (4-6 digits), required when role=CASHIER for PIN login. */
    String pin,
    @NotBlank String role,
    Integer companyId,
    List<Integer> storeIds
) {}
