package com.pos.dto.business;

import com.pos.domain.BusinessFieldType;

import java.util.List;

public record BusinessTypeFieldResponse(
    Integer id,
    String fieldKey,
    String label,
    BusinessFieldType fieldType,
    boolean required,
    boolean enabled,
    int sortOrder,
    String placeholder,
    String hint,
    List<BusinessFieldOptionResponse> options
) {}
