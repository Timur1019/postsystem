package com.pos.dto.business;

public record BusinessTypeResponse(
    Integer id,
    String code,
    String name,
    String description,
    boolean active,
    int sortOrder,
    int fieldsCount
) {}
