package com.pos.dto.company;

public record UpdateCompanyRequest(
    String name,
    String loginCode,
    String legalName,
    String tin,
    String address,
    String phone,
    String businessType,
    Boolean active
) {}
