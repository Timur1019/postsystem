package com.pos.dto.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import com.pos.domain.ProductType;
import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;

import java.math.BigDecimal;
import java.util.List;

public record CreateProductRequest(
    @NotBlank String sku,
    @NotBlank String name,
    String description,
    Integer categoryId,
    @NotNull @DecimalMin("0") BigDecimal costPrice,
    @NotNull @DecimalMin("0.01") BigDecimal sellingPrice,
    @DecimalMin("0") BigDecimal defaultDiscountPercent,
    @NotNull BigDecimal taxRate,
    ProductType productType,
    String templateCode,
    SaleType saleType,
    UnitCode unitCode,
    Integer quantityScale,
    Boolean allowFraction,
    BigDecimal initialStock,
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
    String storageLocation,
    String ownerType,
    String commissionTin,
    String commissionPinfl,
    String uzInvoiceDocumentId,
    @Valid List<ProductStorePriceRequest> storePrices,
    List<String> additionalBarcodes,
    ConstructionProductDetailsRequest constructionDetails,
    RestaurantProductDetailsRequest restaurantDetails,
    ServiceProductDetailsRequest serviceDetails,
    RetailExtrasRequest retailExtras
) {}
