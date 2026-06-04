package com.pos.dto.sale;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record PartialReturnLineRequest(
    @NotNull UUID saleItemId,
    @NotNull @DecimalMin("0.001") BigDecimal quantity
) {}
