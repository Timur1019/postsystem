package com.pos.spreadsheet.parser;

import com.pos.exception.BadRequestException;
import com.pos.util.ProductImportParseUtil;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Парсер счёт-фактуры (Ҳисоб-фактура): извлекает только поля, нужные для номенклатуры POS.
 * Поддерживает бинарный .xls/.xlsx и HTML-файлы с расширением .xls (экспорт с didox / soliq).
 */
@Component
public class UzInvoiceSpreadsheetParser {

    private static final Pattern TOTAL_ROW = Pattern.compile("(?i).*(жами|jami|итого|total).*");

    public List<Map<String, String>> parse(InputStream in) {
        try {
            byte[] bytes = in.readAllBytes();
            List<List<String>> grid;
            if (HtmlExcelTableParser.isHtmlSpreadsheet(bytes)) {
                grid = HtmlExcelTableParser.parse(bytes);
            } else {
                grid = readPoiGrid(bytes);
            }
            return parseProductGrid(grid);
        } catch (BadRequestException e) {
            throw e;
        } catch (IOException e) {
            throw new BadRequestException("Не удалось прочитать Excel: " + e.getMessage());
        }
    }

    private List<List<String>> readPoiGrid(byte[] bytes) throws IOException {
        if (HtmlExcelTableParser.isHtmlSpreadsheet(bytes)) {
            return HtmlExcelTableParser.parse(bytes);
        }
        DataFormatter formatter = new DataFormatter();
        List<List<String>> grid = new ArrayList<>();
        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheetAt(0);
            for (int r = 0; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) {
                    continue;
                }
                List<String> cells = new ArrayList<>();
                int last = Math.max(row.getLastCellNum(), 0);
                for (int c = 0; c < last; c++) {
                    Cell cell = row.getCell(c);
                    cells.add(cell == null ? "" : formatter.formatCellValue(cell).trim());
                }
                if (cells.stream().anyMatch(StringUtils::hasText)) {
                    grid.add(cells);
                }
            }
            return grid;
        } catch (Exception e) {
            throw new BadRequestException(
                "Файл не является корректным Excel. Если это счёт-фактура с портала, загрузите исходный .xls или сохраните таблицу как .xlsx."
            );
        }
    }

    private List<Map<String, String>> parseProductGrid(List<List<String>> grid) {
        int headerRow = findHeaderRow(grid);
        if (headerRow < 0) {
            throw new BadRequestException(
                "Не найдена таблица товаров в счёт-фактуре. Ожидаются колонки «Маҳсулот номи», «Нарх» и т.д."
            );
        }
        String documentId = UzInvoiceDocumentIdExtractor.extractFromGrid(grid);
        ColumnMap columns = mapColumns(grid.get(headerRow));
        List<Map<String, String>> rows = new ArrayList<>();
        for (int r = headerRow + 1; r < grid.size(); r++) {
            Map<String, String> mapped = mapRow(grid.get(r), columns, r + 1, documentId);
            if (mapped != null) {
                rows.add(mapped);
            }
        }
        if (rows.isEmpty()) {
            throw new BadRequestException("В файле не найдено строк товаров для импорта");
        }
        return rows;
    }

    private int findHeaderRow(List<List<String>> grid) {
        int limit = Math.min(45, grid.size());
        for (int r = 0; r < limit; r++) {
            String joined = rowToLower(grid.get(r));
            if (joined.contains("маҳсулот") || joined.contains("mahsulot") || joined.contains("наименован")) {
                if (joined.contains("нарх") || joined.contains("миқдор") || joined.contains("miqdor")
                    || joined.contains("колич") || joined.contains("цена")) {
                    return r;
                }
            }
            if (joined.contains("№") && (joined.contains("номи") || joined.contains("наимен"))) {
                return r;
            }
        }
        return -1;
    }

    private ColumnMap mapColumns(List<String> header) {
        ColumnMap map = new ColumnMap();
        if (header == null || header.isEmpty()) {
            applyDefaults(map);
            return map;
        }
        for (int c = 0; c < header.size(); c++) {
            String h = norm(header.get(c));
            if (h.isEmpty()) {
                continue;
            }
            if (containsAny(h, "маҳсулот номи", "mahsulot nomi", "наименован", "номи (хизмат")) {
                map.name = c;
            } else if (containsAny(h, "идентификация", "икпу", "ikpu", "каталог", "миллий каталог")) {
                map.ikpu = c;
            } else if (containsAny(h, "ўлчов", "olchov", "ед.", "единица", "бирлиги")) {
                map.unit = c;
            } else if (containsAny(h, "миқдор", "miqdor", "колич")) {
                map.qty = c;
            } else if (h.equals("нарх") || h.contains("нарҳ")
                || (h.contains("цена") && !h.contains("қиймат") && !h.contains("сумма"))) {
                map.unitPrice = c;
            } else if ((containsAny(h, "ставка") || h.equals("ққс") || h.equals("qqs") || h.contains("ндс"))
                && !h.contains("сумма")) {
                map.vatRate = c;
            } else if (h.contains("ққс") || h.contains("qqs") || h.contains("ндс")) {
                if (map.vatRate < 0) {
                    map.vatRate = c;
                }
            }
        }
        applyDefaults(map);
        return map;
    }

    private void applyDefaults(ColumnMap map) {
        if (map.name < 0) {
            map.name = 1;
        }
        if (map.ikpu < 0) {
            map.ikpu = 2;
        }
        if (map.unit < 0) {
            map.unit = 3;
        }
        if (map.qty < 0) {
            map.qty = 4;
        }
        if (map.unitPrice < 0) {
            map.unitPrice = 5;
        }
        if (map.vatRate < 0) {
            map.vatRate = 7;
        }
    }

    private Map<String, String> mapRow(List<String> row, ColumnMap cols, int excelRowNum, String uzInvoiceDocumentId) {
        if (row == null || row.isEmpty()) {
            return null;
        }
        String name = cell(row, cols.name);
        if (!StringUtils.hasText(name)) {
            return null;
        }
        if (TOTAL_ROW.matcher(name).matches()) {
            return null;
        }
        if (isSubHeaderOrIndexRow(row, name)) {
            return null;
        }

        return UzInvoiceProductRowMapper.toCatalogRow(
            name.trim(),
            cell(row, cols.ikpu),
            cell(row, cols.unit),
            cell(row, cols.qty),
            cell(row, cols.unitPrice),
            cell(row, cols.vatRate),
            excelRowNum,
            uzInvoiceDocumentId
        );
    }

    private static boolean isSubHeaderOrIndexRow(List<String> row, String name) {
        String n = name.trim();
        if (n.matches("(?i)ставка|сумма")) {
            return true;
        }
        if (n.matches("\\d{1,2}") && isNumericIndexRow(row)) {
            return true;
        }
        return false;
    }

    private static boolean isNumericIndexRow(List<String> row) {
        int numeric = 0;
        int nonEmpty = 0;
        for (String c : row) {
            if (!StringUtils.hasText(c)) {
                continue;
            }
            nonEmpty++;
            if (c.trim().matches("\\d{1,2}")) {
                numeric++;
            }
        }
        return nonEmpty >= 5 && numeric == nonEmpty;
    }

    private static String cell(List<String> row, int col) {
        if (col < 0 || col >= row.size()) {
            return "";
        }
        String v = row.get(col);
        return v == null ? "" : v.trim();
    }

    private static String rowToLower(List<String> row) {
        StringBuilder sb = new StringBuilder();
        int limit = Math.min(12, row.size());
        for (int c = 0; c < limit; c++) {
            sb.append(norm(row.get(c))).append(' ');
        }
        return sb.toString();
    }

    private static String norm(String s) {
        return s == null ? "" : s.trim().toLowerCase(Locale.ROOT).replace('\n', ' ');
    }

    private static boolean containsAny(String haystack, String... needles) {
        for (String n : needles) {
            if (haystack.contains(n)) {
                return true;
            }
        }
        return false;
    }

    private static final class ColumnMap {
        int name = -1;
        int ikpu = -1;
        int unit = -1;
        int qty = -1;
        int unitPrice = -1;
        int vatRate = -1;
    }
}
