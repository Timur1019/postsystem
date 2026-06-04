package com.pos.dto.product;

import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProductResponse(
    UUID id,
    String sku,
    String name,
    String description,
    Integer categoryId,
    String categoryName,
    BigDecimal costPrice,
    BigDecimal sellingPrice,
    BigDecimal defaultDiscountPercent,
    BigDecimal taxRate,
    SaleType saleType,
    UnitCode unitCode,
    int quantityScale,
    boolean allowFraction,
    BigDecimal stockQuantity,
    /** Суммарно списано со склада (продажи, корректировки в минус) по журналу движений. */
    int stockDispatched,
    int lowStockAlert,
    boolean lowStock,
    String barcode,
    List<String> barcodes,
    String imageUrl,
    boolean active,
    Instant createdAt,
    String externalProductId,
    String ikpu,
    String ikpuStatus,
    String unitOfMeasure,
    String unitMeasureCode,
    String packageCode,
    boolean soldIndividually,
    boolean markedProduct,
    String storageLocation,
    String ownerType,
    String commissionTin,
    String commissionPinfl,
    int storesCount,
    List<ProductStorePriceRow> storePrices
) {}
