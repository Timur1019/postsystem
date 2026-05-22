package com.pos.dto.stock;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateWriteOffRequest(
    @NotNull UUID productId,
    @Min(1) int quantity,
    @NotNull String reason,
    String notes,
    Integer storeId
) {}
