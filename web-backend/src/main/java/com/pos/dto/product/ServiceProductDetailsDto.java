package com.pos.dto.product;

public record ServiceProductDetailsDto(
    Integer durationMinutes,
    boolean requiresAppointment
) {}
