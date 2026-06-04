package com.pos.dto.product;

import jakarta.validation.Valid;

import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;

import java.math.BigDecimal;
import java.util.List;

public record UpdateProductRequest(
    String name,
    String description,
    BigDecimal sellingPrice,
    BigDecimal defaultDiscountPercent,
    BigDecimal costPrice,
    BigDecimal taxRate,
    SaleType saleType,
    UnitCode unitCode,
    Integer quantityScale,
    Boolean allowFraction,
    Integer lowStockAlert,
    String imageUrl,
    Integer categoryId,
    String externalProductId,
    String ikpu,
    String ikpuStatus,
    String unitOfMeasure,
    String unitMeasureCode,
    String packageCode,
    Boolean soldIndividually,
    Boolean markedProduct,
    String storageLocation,
    Boolean active,
    String ownerType,
    String commissionTin,
    String commissionPinfl,
    String barcode,
    @Valid List<ProductStorePriceRequest> storePrices,
    List<String> additionalBarcodes
) {}
