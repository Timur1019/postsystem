package com.pos.spreadsheet.parser;

import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Номер электронного счёт-фактуры (напр. Didox/Soliq): {@code IS-00008429} в тексте заголовка
 * («… даги IS-00008429-сонли»).
 */
public final class UzInvoiceDocumentIdExtractor {

    /** Ключ строки после парсера (совпадает с колонкой в БД snake_case через маппер импорта). */
    public static final String ROW_KEY_UZ_INVOICE_DOCUMENT_ID = "uz_invoice_document_id";

    /** Номер фактуры иногда ниже большой шапки; верхний предел строк при поиске. */
    private static final int MAX_SCAN_ROWS = 500;

    /** Типичный формат Uzbek e-invoice number (латиница после цифр и дефиса — `\b` срабатывает до кириллицы). */
    private static final Pattern IS_STYLE_ID = Pattern.compile("(?i)\\b(IS-\\d+)\\b");

    /** Вариант без пробела между IS и номером. */
    private static final Pattern IS_COMPACT = Pattern.compile("(?i)\\b(IS\\d{6,})\\b");

    /**
     * Другие префиксы (2–12 латинских букв) с не менее чем 5 цифрами после первого дефиса —
     * без повторной ловни коротких фрагментов вроде {@code Z-93}.
     */
    private static final Pattern PREFIX_DIGITS_ID =
        Pattern.compile("(?i)\\b([A-Z]{2,12}-\\d{5,})(?:/[A-Za-z0-9.-]+)?\\b");

    private UzInvoiceDocumentIdExtractor() {
    }

    /** Сканирует сетку счёт-фактуры до {@link #MAX_SCAN_ROWS} строк (номер может быть ниже большой шапки). */
    public static String extractFromGrid(List<List<String>> grid) {
        if (grid == null || grid.isEmpty()) {
            return null;
        }
        int limit = Math.min(MAX_SCAN_ROWS, grid.size());
        for (int r = 0; r < limit; r++) {
            List<String> row = grid.get(r);
            if (row == null) {
                continue;
            }
            for (String cell : row) {
                String hit = extractFromPlainText(cell);
                if (hit != null) {
                    return hit;
                }
            }
        }
        return null;
    }

    public static String extractFromPlainText(String text) {
        if (!StringUtils.hasText(text)) {
            return null;
        }
        Matcher is = IS_STYLE_ID.matcher(text);
        if (is.find()) {
            return is.group(1).toUpperCase(Locale.ROOT);
        }
        Matcher isCompact = IS_COMPACT.matcher(text);
        if (isCompact.find()) {
            String raw = isCompact.group(1).toUpperCase(Locale.ROOT);
            if (raw.length() > 2) {
                return "IS-" + raw.substring(2);
            }
        }
        Matcher gen = PREFIX_DIGITS_ID.matcher(text);
        if (gen.find()) {
            return normalizeToken(gen.group(1));
        }
        return null;
    }

    private static String normalizeToken(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }
}
