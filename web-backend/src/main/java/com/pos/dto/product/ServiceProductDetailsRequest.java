package com.pos.dto.product;

public record ServiceProductDetailsRequest(
    Integer durationMinutes,
    Boolean requiresAppointment
) {}
