package com.pos.dto.product;

public record RestaurantProductDetailsDto(
    Integer preparationTimeMinutes,
    String kitchenDepartment,
    boolean comboComponent
) {}
