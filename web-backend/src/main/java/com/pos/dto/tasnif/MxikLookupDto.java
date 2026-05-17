package com.pos.dto.tasnif;

public record MxikLookupDto(
    String mxik,
    String name,
    String description,
    String barcode,
    String unitOfMeasure,
    String unitMeasureCode,
    String packageCode,
    boolean markedProduct,
    boolean usePackage
) {}
