package com.pos.util;

import org.springframework.util.StringUtils;

/**
 * Общие операции с текстом запросов и DTO. Не дублировать trimOrNull в сервисах.
 */
public final class TextUtil {

    private TextUtil() {
    }

    public static String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    /** Пустой search → "", иначе trim. */
    public static String normalizeSearch(String search) {
        return StringUtils.hasText(search) ? search.trim() : "";
    }
}
