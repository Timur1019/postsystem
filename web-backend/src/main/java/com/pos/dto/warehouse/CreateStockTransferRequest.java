package com.pos.dto.warehouse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateStockTransferRequest(
    @NotNull Integer fromStoreId,
    @NotNull Integer toStoreId,
    String notes,
    @NotEmpty @Valid List<StockTransferLineRequest> lines
) {}
