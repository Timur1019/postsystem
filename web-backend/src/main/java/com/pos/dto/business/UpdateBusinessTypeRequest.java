package com.pos.dto.business;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateBusinessTypeRequest(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 2000) String description,
    Boolean active,
    Integer sortOrder
) {}
