package com.pos.util;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;

public final class CsvUtil {

    private CsvUtil() {
    }

    public static byte[] utf8BomCsv(String body) {
        return ("\uFEFF" + body).getBytes(StandardCharsets.UTF_8);
    }

    public static String row(List<String> cells) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cells.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(escape(cells.get(i)));
        }
        sb.append('\n');
        return sb.toString();
    }

    private static String escape(String raw) {
        String s = raw == null ? "" : raw;
        boolean needQuotes = s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0 || s.indexOf('\r') >= 0;
        String t = s.replace("\"", "\"\"");
        return needQuotes ? "\"" + t + "\"" : t;
    }

    /** Safe string for CSV from any object (numbers, etc.). */
    public static String cell(Object o) {
        if (o == null) {
            return "";
        }
        return Objects.toString(o, "");
    }
}
