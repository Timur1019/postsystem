package com.pos.spreadsheet.parser;

import org.springframework.util.StringUtils;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Reads &quot;Excel&quot; files that are actually HTML tables (SpreadsheetML export from tax portals).
 */
public final class HtmlExcelTableParser {

    private static final Pattern TR = Pattern.compile("<tr[^>]*>(.*?)</tr>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern TD = Pattern.compile("<t[dh][^>]*>(.*?)</t[dh]>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern TAGS = Pattern.compile("<[^>]+>");

    private HtmlExcelTableParser() {
    }

    public static boolean isHtmlSpreadsheet(byte[] bytes) {
        if (bytes == null || bytes.length < 5) {
            return false;
        }
        int len = Math.min(bytes.length, 512);
        String start = new String(bytes, 0, len, StandardCharsets.UTF_8).trim().toLowerCase();
        return start.startsWith("<html") || start.startsWith("<!doctype html") || start.contains("<table");
    }

    public static List<List<String>> parse(byte[] bytes) {
        Charset charset = detectCharset(bytes);
        String html = new String(bytes, charset);
        List<List<String>> rows = new ArrayList<>();
        Matcher trMatcher = TR.matcher(html);
        while (trMatcher.find()) {
            List<String> cells = new ArrayList<>();
            Matcher tdMatcher = TD.matcher(trMatcher.group(1));
            while (tdMatcher.find()) {
                String text = cleanCell(tdMatcher.group(1));
                if (StringUtils.hasText(text)) {
                    cells.add(text);
                } else {
                    cells.add("");
                }
            }
            if (!cells.isEmpty() && cells.stream().anyMatch(StringUtils::hasText)) {
                rows.add(cells);
            }
        }
        return rows;
    }

    private static Charset detectCharset(byte[] bytes) {
        String head = new String(bytes, 0, Math.min(bytes.length, 2000), StandardCharsets.ISO_8859_1).toLowerCase();
        if (head.contains("charset=windows-1251") || head.contains("charset=cp1251")) {
            return Charset.forName("windows-1251");
        }
        return StandardCharsets.UTF_8;
    }

    private static String cleanCell(String raw) {
        if (raw == null) {
            return "";
        }
        String s = TAGS.matcher(raw).replaceAll("");
        s = s.replace("&nbsp;", " ")
            .replace("\u00a0", " ")
            .replace("\r", " ")
            .replace("\n", " ")
            .trim();
        return s.replaceAll("\\s{2,}", " ");
    }
}
