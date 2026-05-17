package com.pos.dto.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ProductExportRequest(
    String storeIds,
    @DecimalMin("0") BigDecimal markupPercent,
    List<@Valid PriceOverride> priceOverrides
) {
    public record PriceOverride(
        UUID productId,
        @DecimalMin("0.01") BigDecimal sellingPrice
    ) {
    }
}
