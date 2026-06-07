package com.pos.dto.sync;

import com.pos.dto.category.CategoryResponse;
import com.pos.dto.product.ProductResponse;
import com.pos.dto.sale.CreateSaleRequest;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CashierSyncBootstrapResponse(
    Integer storeId,
    String storeName,
    List<CategoryResponse> categories,
    List<ProductResponse> products,
    Instant syncedAt
) {}
