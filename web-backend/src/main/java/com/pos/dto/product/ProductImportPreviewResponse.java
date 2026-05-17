package com.pos.dto.product;

import java.util.List;

public record ProductImportPreviewResponse(
    String source,
    int totalRows,
    int newRows,
    int duplicateRows,
    int invalidRows,
    List<ProductImportPreviewRow> rows
) {
}
