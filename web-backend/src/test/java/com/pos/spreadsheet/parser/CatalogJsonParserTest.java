package com.pos.spreadsheet.parser;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CatalogJsonParserTest {

    private final CatalogJsonParser parser = new CatalogJsonParser(new ObjectMapper());

    @Test
    void parsesProductsArray() {
        String json = """
            {
              "products": [
                {
                  "sku": "SKU-1",
                  "name": "Test product",
                  "selling_price": "10000",
                  "stock_quantity": 5
                }
              ]
            }
            """;
        List<Map<String, String>> rows = parser.parse(json.getBytes(StandardCharsets.UTF_8));
        assertEquals(1, rows.size());
        assertEquals("SKU-1", rows.get(0).get("sku"));
        assertEquals("Test product", rows.get(0).get("name"));
        assertEquals("10000", rows.get(0).get("selling_price"));
    }
}
