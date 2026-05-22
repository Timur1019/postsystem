package com.pos.dto.warehouse;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record StockInventoryLineRequest(
    @NotNull UUID productId,
    @Min(0) int countedQuantity
) {}
