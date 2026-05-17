package com.pos.dto.company;

import jakarta.validation.constraints.NotBlank;

public record CreateCompanyRequest(
    @NotBlank String name,
    String legalName,
    String tin,
    String address,
    String phone,
    Boolean active
) {}
