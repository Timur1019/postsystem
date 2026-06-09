package com.pos.dto.business;

public record BusinessFieldOptionResponse(
    Integer id,
    String value,
    String label,
    int sortOrder
) {}
