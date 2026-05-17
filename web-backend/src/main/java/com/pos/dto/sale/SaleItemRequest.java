package com.pos.dto.sale;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record SaleItemRequest(
    @NotNull UUID productId,
    @Min(1) int quantity,
    BigDecimal discount
) {}
