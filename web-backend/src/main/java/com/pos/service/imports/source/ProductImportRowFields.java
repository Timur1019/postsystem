package com.pos.service.imports.source;

import com.pos.domain.SaleType;

import java.math.BigDecimal;

/**
 * Общие поля строки импорта после первичного парсинга. Идентификация (SKU/имя) и дедупликация
 * остаются на стороне конкретного {@link ProductImportSourceHandler}.
 */
public record ProductImportRowFields(
    String ikpu,
    String storageLocation,
    String uzInvoiceDocumentId,
    BigDecimal sellingPrice,
    BigDecimal taxRatePercent,
    BigDecimal quantity,
    String unitOfMeasure,
    SaleType saleType
) {
}
