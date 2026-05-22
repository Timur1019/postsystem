package com.pos.spreadsheet.parser;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UzInvoiceJsonParserTest {

    private final UzInvoiceJsonParser parser = new UzInvoiceJsonParser(new ObjectMapper());

    @Test
    void parsesFlatItemsArray() {
        String json = """
            {
              "items": [
                {
                  "name": "POS terminal",
                  "ikpu": "08470001002000000",
                  "quantity": 1,
                  "price": "3 125 000,00",
                  "unit": "dona",
                  "vatRate": 12
                }
              ]
            }
            """;
        List<Map<String, String>> rows = parser.parse(json.getBytes(StandardCharsets.UTF_8));
        assertFalse(rows.isEmpty());
        Map<String, String> first = rows.get(0);
        assertEquals("INV-2", first.get("sku"));
        assertEquals("08470001002000000", first.get("ikpu"));
        assertTrue(first.get("name").toLowerCase().contains("pos terminal"));
        assertEquals("3125000.00", first.get("selling_price"));
    }

    @Test
    void parsesFakturaDocumentItems() {
        String json = """
            {
              "document": {
                "items": [
                  {
                    "productName": "Mahsulot",
                    "catalogCode": "08470001002000000",
                    "volume": 2,
                    "unitPrice": 1500000,
                    "vat": { "vat_rate": 12 }
                  }
                ]
              }
            }
            """;
        List<Map<String, String>> rows = parser.parse(json.getBytes(StandardCharsets.UTF_8));
        assertEquals(1, rows.size());
        assertEquals("INV-2", rows.get(0).get("sku"));
        assertEquals("1500000", rows.get(0).get("selling_price"));
        assertEquals("2", rows.get(0).get("stock_quantity"));
    }

    @Test
    void parsesFakturaArrayOfDocuments() {
        String json = """
            [
              {
                "id": "INV_1",
                "document": {
                  "items": [
                    {
                      "description": "POS terminal",
                      "catalog_code": "08470001002000000",
                      "volume": "1",
                      "unit_price": "3 125 000,00",
                      "measurement_unit": "dona",
                      "vat": { "vat_rate": "12" }
                    }
                  ]
                }
              }
            ]
            """;
        List<Map<String, String>> rows = parser.parse(json.getBytes(StandardCharsets.UTF_8));
        assertEquals(1, rows.size());
        assertEquals("INV-2", rows.get(0).get("sku"));
        assertEquals("3125000.00", rows.get(0).get("selling_price"));
    }

    @Test
    void looksLikeJsonDetectsObject() {
        assertTrue(UzInvoiceJsonParser.looksLikeJson("{ \"a\": 1 }".getBytes(StandardCharsets.UTF_8)));
        assertFalse(UzInvoiceJsonParser.looksLikeJson("<html>".getBytes(StandardCharsets.UTF_8)));
    }
}
