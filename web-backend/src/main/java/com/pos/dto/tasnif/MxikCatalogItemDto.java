package com.pos.dto.tasnif;

import java.util.List;

public record MxikCatalogItemDto(
    String mxik,
    String name,
    String description,
    /** Штрихкод из tasnif (поле internalCode) */
    String barcode,
    String internalCode,
    boolean markedProduct,
    boolean usePackage,
    List<MxikPackageDto> packages
) {}
