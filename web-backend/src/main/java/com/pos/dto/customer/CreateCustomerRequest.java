package com.pos.dto.customer;

import jakarta.validation.constraints.NotBlank;

public record CreateCustomerRequest(
    @NotBlank String name,
    String phone,
    String email
) {}
