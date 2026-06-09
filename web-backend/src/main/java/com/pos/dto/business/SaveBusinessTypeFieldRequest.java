package com.pos.dto.business;

import com.pos.domain.BusinessFieldType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SaveBusinessTypeFieldRequest(
    @NotBlank @Size(max = 64)
    @Pattern(regexp = "^[a-z][a-z0-9_]*$", message = "Key must be lower_snake_case")
    String fieldKey,
    @NotBlank @Size(max = 200) String label,
    @NotNull BusinessFieldType fieldType,
    Boolean required,
    Boolean enabled,
    Integer sortOrder,
    @Size(max = 200) String placeholder,
    @Size(max = 500) String hint,
    @Valid List<SaveFieldOptionRequest> options
) {}
