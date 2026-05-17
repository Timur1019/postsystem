package com.pos.dto.store;

public record StoreResponse(
    Integer id,
    String name,
    String code,
    String address,
    String phone,
    Integer companyId,
    String companyName,
    boolean active
) {}
