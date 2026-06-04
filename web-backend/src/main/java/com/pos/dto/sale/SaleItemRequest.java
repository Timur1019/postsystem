package com.pos.dto.sale;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record SaleItemRequest(
    @NotNull UUID productId,
    @NotNull @DecimalMin("0.001") BigDecimal quantity,
    BigDecimal discount,
    /** Цена за единицу из кассы (если кассир изменил в чеке); иначе — из каталога. */
    @DecimalMin("0") BigDecimal unitPrice
) {}
