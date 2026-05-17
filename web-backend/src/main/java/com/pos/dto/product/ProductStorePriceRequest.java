package com.pos.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProductStorePriceRequest(
    @NotNull Integer storeId,
    @NotNull @DecimalMin("0") BigDecimal price
) {}
