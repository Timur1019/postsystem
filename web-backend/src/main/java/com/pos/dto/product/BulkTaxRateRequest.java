package com.pos.dto.product;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record BulkTaxRateRequest(
    @NotEmpty List<UUID> productIds,
    @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal taxRate
) {}
