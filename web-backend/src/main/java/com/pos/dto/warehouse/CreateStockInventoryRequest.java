package com.pos.dto.warehouse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CreateStockInventoryRequest(
    Integer storeId,
    String notes,
    @NotEmpty @Valid List<StockInventoryLineRequest> lines
) {}
