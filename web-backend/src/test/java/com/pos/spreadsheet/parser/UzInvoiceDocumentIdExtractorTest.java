package com.pos.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class UzInvoiceDocumentIdExtractorTest {

    @Test
    void matchesIsStyleInUzHeaderSentence() {
        assertEquals(
            "IS-00008429",
            UzInvoiceDocumentIdExtractor.extractFromPlainText("13.04.2024 даги IS-00008429-сонли")
        );
    }

    @Test
    void matchesIsStyleStandalone() {
        assertEquals(
            "IS-12345",
            UzInvoiceDocumentIdExtractor.extractFromPlainText("inv: is-12345 end")
        );
    }

    @Test
    void matchesLongIsNumber() {
        assertEquals(
            "IS-00012026",
            UzInvoiceDocumentIdExtractor.extractFromPlainText("2026 даги IS-00012026-сонли")
        );
    }

    @Test
    void normalizesCompactIsWithoutHyphen() {
        assertEquals("IS-00008429", UzInvoiceDocumentIdExtractor.extractFromPlainText("№ IS00008429 дата"));
    }

    @Test
    void extractFromGridScansHeaderBeforeTable() {
        List<List<String>> grid = new ArrayList<>();
        grid.add(Arrays.asList("Ҳисобварақ-фактура", "", ""));
        grid.add(Arrays.asList("13.04.2024 даги IS-00008429-сонли", "", ""));
        grid.add(Arrays.asList("№", "Маҳсулот номи", "Нарх"));
        grid.add(Arrays.asList("1", "Test", "1000"));
        assertEquals("IS-00008429", UzInvoiceDocumentIdExtractor.extractFromGrid(grid));
    }

    @Test
    void buildsScopedSkuWhenDocumentIdPresent() {
        var row = UzInvoiceProductRowMapper.toCatalogRow(
            "Сок", "02202002001544001 - Описание", null, "dona", "1", "1500", "12", 4, "IS-00008429"
        );
        assertNotNull(row);
        assertEquals("IS-00008429-L-4", row.get("sku"));
        assertEquals("IS-00008429", row.get(UzInvoiceDocumentIdExtractor.ROW_KEY_UZ_INVOICE_DOCUMENT_ID));
    }
}
