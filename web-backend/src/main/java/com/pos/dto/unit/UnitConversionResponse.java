package com.pos.dto.unit;

import java.math.BigDecimal;

public record UnitConversionResponse(
    String fromCode,
    String toCode,
    BigDecimal factor
) {}
