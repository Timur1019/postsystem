package com.pos.dto.store;

public record UpdateStoreRequest(
    String name,
    String code,
    String address,
    String phone,
    Integer companyId,
    String businessType,
    Boolean active
) {}
