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
    @NotBlank @Size(min = 6) String password,
    @NotBlank String role,
    Integer companyId,
    List<Integer> storeIds
) {}
