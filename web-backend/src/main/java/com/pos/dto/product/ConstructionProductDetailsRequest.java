package com.pos.dto.product;

import java.math.BigDecimal;

public record ConstructionProductDetailsRequest(
    BigDecimal standardLength,
    BigDecimal width,
    BigDecimal thickness,
    Boolean allowCutting
) {}
