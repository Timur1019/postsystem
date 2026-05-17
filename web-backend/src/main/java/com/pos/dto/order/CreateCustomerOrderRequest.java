package com.pos.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateCustomerOrderRequest(
    @NotNull Integer storeId,
    @NotBlank @Size(max = 255) String clientName,
    @NotBlank @Size(max = 40) String clientPhone,
    @NotBlank String deliveryAddress,
    @Size(max = 4000) String comment,
    UUID courierId
) {}
