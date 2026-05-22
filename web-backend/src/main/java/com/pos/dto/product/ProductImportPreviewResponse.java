package com.pos.dto.product;

import java.util.List;

public record ProductImportPreviewResponse(
    String source,
    /** Номер e-счёт-фактуры из файла (UZ_INVOICE), напр. IS-00012026. */
    String uzInvoiceDocumentId,
    /** В БД уже есть активный товар с этим номером фактуры. */
    boolean invoiceAlreadyImported,
    int totalRows,
    int newRows,
    int duplicateRows,
    int invalidRows,
    List<ProductImportPreviewRow> rows
) {
}
