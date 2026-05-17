package com.pos.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UzInvoiceSpreadsheetParserTest {

    private final UzInvoiceSpreadsheetParser parser = new UzInvoiceSpreadsheetParser();

    @Test
    void parsesHtmlInvoiceFromDesktopWhenPresent() throws Exception {
        Path path = Path.of(System.getProperty("user.home"), "Desktop")
            .resolve("Ҳисоб-фактура актсиз_ 8  30.04.2026 дан.xls");
        if (!Files.isRegularFile(path)) {
            path = Path.of(System.getProperty("user.home"), "Desktop")
                .resolve("Ҳисоб-фактура актсиз_  8  30.04.2026 дан.xls");
        }
        if (!Files.isRegularFile(path)) {
            return;
        }
        byte[] bytes = Files.readAllBytes(path);
        assertTrue(HtmlExcelTableParser.isHtmlSpreadsheet(bytes));

        List<Map<String, String>> rows;
        try (var in = Files.newInputStream(path)) {
            rows = parser.parse(in);
        }
        assertFalse(rows.isEmpty());
        Map<String, String> first = rows.get(0);
        assertEquals("08470001002000000", first.get("ikpu"));
        assertTrue(first.get("name").toLowerCase().contains("pos terminal"));
        assertEquals("3125000.00", first.get("selling_price"));
    }
}
