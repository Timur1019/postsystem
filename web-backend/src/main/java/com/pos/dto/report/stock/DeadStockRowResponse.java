package com.pos.dto.report.stock;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DeadStockRowResponse(
    UUID productId,
    String productName,
    String sku,
    String barcode,
    String categoryName,
    int stockQuantity,
    BigDecimal stockValue,
    LocalDate lastSaleDate,
    int daysWithoutSale
) {}
