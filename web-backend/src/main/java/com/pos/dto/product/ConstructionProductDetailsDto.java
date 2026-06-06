package com.pos.dto.product;

import java.math.BigDecimal;

public record ConstructionProductDetailsDto(
    BigDecimal standardLength,
    BigDecimal width,
    BigDecimal thickness,
    boolean allowCutting
) {}
