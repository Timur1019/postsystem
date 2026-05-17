package com.pos.util;

import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Парсинг значений строк импорта номенклатуры (после чтения Excel через {@link com.pos.spreadsheet.ExcelSpreadsheetReader}).
 */
public final class ProductImportParseUtil {

    private ProductImportParseUtil() {
    }

    public static boolean isInactiveFlag(String activeStr) {
        if (!StringUtils.hasText(activeStr)) {
            return false;
        }
        String s = activeStr.trim().toLowerCase(Locale.ROOT);
        return "0".equals(s) || "false".equals(s) || "no".equals(s) || "off".equals(s);
    }

    public static boolean isRowEmpty(Map<String, String> row) {
        for (String v : row.values()) {
            if (StringUtils.hasText(v)) {
                return false;
            }
        }
        return true;
    }

    public static String cell(Map<String, String> row, String key) {
        String v = row.get(key.toLowerCase(Locale.ROOT));
        return v == null ? "" : v.trim();
    }

    public static Optional<BigDecimal> parseDecimalOpt(String raw) {
        if (!StringUtils.hasText(raw)) {
            return Optional.empty();
        }
        String cleaned = normalizeNumber(raw);
        if (cleaned.isEmpty()) {
            return Optional.empty();
        }
        try {
            return Optional.of(new BigDecimal(cleaned));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    public static Optional<Integer> parseIntOpt(String raw) {
        if (!StringUtils.hasText(raw)) {
            return Optional.empty();
        }
        String cleaned = normalizeNumber(raw);
        if (cleaned.isEmpty()) {
            return Optional.empty();
        }
        int dot = cleaned.indexOf('.');
        if (dot >= 0) {
            cleaned = cleaned.substring(0, dot);
        }
        try {
            return Optional.of(Integer.parseInt(cleaned));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    /** Узбекский/русский формат: {@code 3 125 000,00} → {@code 3125000.00} */
    private static String normalizeNumber(String raw) {
        return raw.trim()
            .replace("\u00a0", "")
            .replace(" ", "")
            .replace(',', '.');
    }

    public static List<Integer> parseStoreIdList(String param) {
        if (!StringUtils.hasText(param)) {
            return List.of();
        }
        List<Integer> out = new java.util.ArrayList<>();
        for (String part : param.split(",")) {
            String s = part.trim();
            if (s.isEmpty()) {
                continue;
            }
            try {
                out.add(Integer.parseInt(s));
            } catch (NumberFormatException ignored) {
                // skip invalid token
            }
        }
        return out;
    }
}
