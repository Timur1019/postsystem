package com.pos.dto.product;

import java.math.BigDecimal;

public record ProductImportPreviewRow(
    int rowNum,
    String sku,
    String name,
    String ikpu,
    /** Расположение на складе (из файла или значение по умолчанию при предпросмотре). */
    String storageLocation,
    /** Номер e-счёт-фактуры (напр. IS-00008429), только для источника UZ_INVOICE. */
    String uzInvoiceDocumentId,
    String unitOfMeasure,
    BigDecimal quantity,
    BigDecimal fileSellingPrice,
    BigDecimal existingSellingPrice,
    BigDecimal taxRatePercent,
    String status,
    String existingSku,
    String existingName,
    String message
) {
    public static final String STATUS_NEW = "NEW";
    public static final String STATUS_DUPLICATE = "DUPLICATE";
    public static final String STATUS_INVALID = "INVALID";
}
