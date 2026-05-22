package com.pos.dto.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.util.List;

public record ProductImportConfirmRequest(
    String strategy,
    String source,
    Boolean skipDuplicates,
    Integer defaultCategoryId,
    Integer defaultStoreId,
    /** Расположение на складе для всех новых позиций, если в файле/строке не задано. */
    String defaultStorageLocation,
    @Valid List<ImportRowConfirm> rows
) {
    public record ImportRowConfirm(
        int rowNum,
        @DecimalMin("0.01") BigDecimal sellingPrice,
        Integer categoryId,
        Integer storeId,
        String storageLocation
    ) {
    }
}
