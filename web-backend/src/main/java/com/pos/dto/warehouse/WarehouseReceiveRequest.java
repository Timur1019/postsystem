package com.pos.dto.warehouse;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record WarehouseReceiveRequest(
    @NotNull UUID productId,
    @NotNull @Min(1) Integer quantity,
    @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal unitSellingPrice,
    @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal purchasePrice,
    /** null — не менять НДС; 0 или 12 — установить процент */
    @Min(0) @Max(100) Integer vatPercent,
    boolean markedProduct,
    String storageLocation
) {}
