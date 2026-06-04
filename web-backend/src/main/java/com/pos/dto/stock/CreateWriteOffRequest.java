package com.pos.dto.stock;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateWriteOffRequest(
    @NotNull UUID productId,
    @NotNull @DecimalMin("0.001") BigDecimal quantity,
    @NotNull String reason,
    String notes,
    Integer storeId
) {}
