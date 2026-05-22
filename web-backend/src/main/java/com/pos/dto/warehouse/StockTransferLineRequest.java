package com.pos.dto.warehouse;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record StockTransferLineRequest(
    @NotNull UUID productId,
    @Min(1) int quantity
) {}
