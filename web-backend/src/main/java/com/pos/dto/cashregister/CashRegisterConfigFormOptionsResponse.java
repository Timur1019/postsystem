package com.pos.dto.cashregister;

import com.pos.dto.category.CategoryResponse;
import com.pos.dto.store.StoreResponse;

import java.util.List;

public record CashRegisterConfigFormOptionsResponse(
    List<StoreResponse> stores,
    List<CashRegisterRowResponse> registers,
    List<CategoryResponse> categories
) {}
