package com.pos.dto.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CreateProductRequest(
    @NotBlank String sku,
    @NotBlank String name,
    String description,
    Integer categoryId,
    @NotNull @DecimalMin("0") BigDecimal costPrice,
    @NotNull @DecimalMin("0.01") BigDecimal sellingPrice,
    @NotNull BigDecimal taxRate,
    Integer initialStock,
    Integer lowStockAlert,
    String barcode,
    String imageUrl,
    String externalProductId,
    String ikpu,
    String ikpuStatus,
    String unitOfMeasure,
    String unitMeasureCode,
    String packageCode,
    Boolean soldIndividually,
    Boolean markedProduct,
    String ownerType,
    String commissionTin,
    String commissionPinfl,
    @Valid List<ProductStorePriceRequest> storePrices,
    List<String> additionalBarcodes
) {}
