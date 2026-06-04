package com.pos.dto.warehouse;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record StockTransferLineRequest(
    @NotNull UUID productId,
    @NotNull @DecimalMin("0.001") BigDecimal quantity
) {}
