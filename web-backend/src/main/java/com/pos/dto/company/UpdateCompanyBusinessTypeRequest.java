package com.pos.dto.company;

import jakarta.validation.constraints.NotBlank;

public record UpdateCompanyBusinessTypeRequest(
    @NotBlank String businessType
) {}
