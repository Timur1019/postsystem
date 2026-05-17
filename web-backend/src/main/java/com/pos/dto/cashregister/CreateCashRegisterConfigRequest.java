package com.pos.dto.cashregister;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public record CreateCashRegisterConfigRequest(
    @NotBlank(message = "Name is required")
    @Size(max = 200)
    String name,
    List<Integer> storeIds,
    List<Long> cashRegisterIds,
    List<Integer> categoryIds
) {
    public CreateCashRegisterConfigRequest {
        storeIds = storeIds == null ? List.of() : new ArrayList<>(storeIds);
        cashRegisterIds = cashRegisterIds == null ? List.of() : new ArrayList<>(cashRegisterIds);
        categoryIds = categoryIds == null ? List.of() : new ArrayList<>(categoryIds);
    }
}
