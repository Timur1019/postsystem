package com.pos.dto.business;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SaveBusinessTypeRequest(
    @NotBlank @Size(max = 32)
    @Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "Code must be UPPER_SNAKE_CASE")
    String code,
    @NotBlank @Size(max = 200) String name,
    @Size(max = 2000) String description,
    Boolean active,
    Integer sortOrder
) {}
