package com.pos.spreadsheet.parser;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.exception.BadRequestException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Импорт номенклатуры из JSON (массив товаров с полями шаблона Excel).
 */
@Component
public class CatalogJsonParser {

    private static final String[] ARRAY_KEYS = {
        "products", "items", "rows", "data", "catalog", "nomenclature", "goods"
    };

    private final ObjectMapper objectMapper;

    public CatalogJsonParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<Map<String, String>> parse(byte[] bytes) {
        try {
            JsonNode root = objectMapper.readTree(bytes);
            List<JsonNode> nodes = collectProductNodes(root);
            List<Map<String, String>> rows = new ArrayList<>();
            for (JsonNode node : nodes) {
                Map<String, String> row = mapCatalogNode(node);
                if (row != null) {
                    rows.add(row);
                }
            }
            if (rows.isEmpty()) {
                throw new BadRequestException(
                    "В JSON не найдено товаров. Ожидается массив с полями sku и name."
                );
            }
            return rows;
        } catch (BadRequestException e) {
            throw e;
        } catch (IOException e) {
            throw new BadRequestException("Не удалось разобрать JSON: " + e.getMessage());
        }
    }

    private List<JsonNode> collectProductNodes(JsonNode root) {
        List<JsonNode> found = new ArrayList<>();
        if (root == null || root.isNull()) {
            return found;
        }
        if (root.isArray()) {
            for (JsonNode el : root) {
                if (el != null && el.isObject()) {
                    found.add(el);
                }
            }
            return found;
        }
        for (String key : ARRAY_KEYS) {
            JsonNode arr = findPathIgnoreCase(root, key);
            if (arr != null && arr.isArray()) {
                for (JsonNode el : arr) {
                    if (el != null && el.isObject()) {
                        found.add(el);
                    }
                }
                if (!found.isEmpty()) {
                    return found;
                }
            }
        }
        return found;
    }

    private Map<String, String> mapCatalogNode(JsonNode node) {
        String sku = firstText(node, "sku", "article", "artikul", "code", "product_code");
        String name = firstText(node, "name", "title", "product_name", "productName", "nomi");
        if (!StringUtils.hasText(sku) && !StringUtils.hasText(name)) {
            return null;
        }

        Map<String, String> map = new LinkedHashMap<>();
        put(map, "sku", sku);
        put(map, "name", name);
        put(map, "category", firstText(node, "category", "category_name", "categoryName"));
        put(map, "selling_price", firstText(node, "selling_price", "sellingPrice", "price", "sale_price"));
        put(map, "cost_price", firstText(node, "cost_price", "costPrice", "cost"));
        put(map, "tax_rate_percent_nds", firstText(
            node, "tax_rate_percent_nds", "taxRate", "tax_rate", "vat", "nds", "qqs"
        ));
        put(map, "ikpu", firstText(node, "ikpu", "ikpu_code", "ikpuCode"));
        put(map, "unit_of_measure", firstText(node, "unit_of_measure", "unitOfMeasure", "unit", "uom"));
        put(map, "barcode", firstText(node, "barcode", "bar_code", "ean"));
        put(map, "stock_quantity", firstText(node, "stock_quantity", "stockQuantity", "quantity", "qty", "stock"));
        put(map, "active", firstText(node, "active", "is_active", "enabled"));
        if (!map.containsKey("active") || !StringUtils.hasText(map.get("active"))) {
            map.put("active", "1");
        }
        return map;
    }

    private static void put(Map<String, String> map, String key, String value) {
        if (StringUtils.hasText(value)) {
            map.put(key, value.trim());
        }
    }

    private static String firstText(JsonNode node, String... keys) {
        for (String key : keys) {
            String v = text(findPathIgnoreCase(node, key));
            if (StringUtils.hasText(v)) {
                return v;
            }
        }
        return null;
    }

    private static JsonNode findPathIgnoreCase(JsonNode node, String key) {
        if (node == null || !node.isObject()) {
            return null;
        }
        String lower = key.toLowerCase(Locale.ROOT);
        Iterator<String> names = node.fieldNames();
        while (names.hasNext()) {
            String name = names.next();
            if (name.equalsIgnoreCase(key) || name.toLowerCase(Locale.ROOT).equals(lower)) {
                return node.get(name);
            }
        }
        return null;
    }

    private static String text(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isTextual() || node.isNumber() || node.isBoolean()) {
            return node.asText().trim();
        }
        return null;
    }
}
