package com.pos.dto.sale;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateSaleRequest(
    @NotEmpty @Valid List<SaleItemRequest> items,
    @NotBlank String paymentMethod,
    Integer storeId,
    BigDecimal amountTendered,
    String notes,
    UUID customerId,
    String receiptType,
    String cardType
) {}
