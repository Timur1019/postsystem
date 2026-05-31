package com.pos.dto.company;

public record CompanyResponse(
    Integer id,
    String name,
    String loginCode,
    String legalName,
    String tin,
    String address,
    String phone,
    boolean active,
    int storeCount
) {}
