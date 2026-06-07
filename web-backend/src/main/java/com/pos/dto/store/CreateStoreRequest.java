package com.pos.dto.store;

import jakarta.validation.constraints.NotBlank;

public record CreateStoreRequest(
    @NotBlank String name,
    String code,
    String address,
    String phone,
    Integer companyId,
    String businessType,
    Boolean active
) {}
