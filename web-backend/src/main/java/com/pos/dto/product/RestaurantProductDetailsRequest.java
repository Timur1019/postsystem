package com.pos.dto.product;

public record RestaurantProductDetailsRequest(
    Integer preparationTimeMinutes,
    String kitchenDepartment,
    Boolean comboComponent
) {}
