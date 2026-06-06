package com.pos.dto.unit;

import java.math.BigDecimal;

public record UnitResponse(
    String code,
    String category,
    String labelRu,
    String labelUz,
    String labelShortRu,
    int quantityScale,
    boolean allowFraction,
    BigDecimal posMinQty,
    BigDecimal posStep,
    boolean stockAllowed,
    boolean receiptOnly
) {}
