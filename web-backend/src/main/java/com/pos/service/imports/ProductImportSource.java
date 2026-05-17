package com.pos.service.imports;

public enum ProductImportSource {
    CATALOG,
    UZ_INVOICE;

    public static ProductImportSource fromParam(String raw) {
        if (raw == null || raw.isBlank()) {
            return CATALOG;
        }
        return switch (raw.trim().toUpperCase(java.util.Locale.ROOT)) {
            case "UZ_INVOICE", "INVOICE", "HISOB_FAKTURA", "СЧЕТ", "СЧЁТ" -> UZ_INVOICE;
            default -> CATALOG;
        };
    }
}
