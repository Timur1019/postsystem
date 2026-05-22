package com.pos.dto.warehouse;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record StockReceiptLineRequest(
    @NotNull UUID productId,
    @NotNull @Min(1) Integer quantity,
    @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal purchasePrice,
    @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal unitSellingPrice,
    @Min(0) @Max(100) Integer vatPercent,
    Boolean markedProduct,
    String storageLocation
) {}
