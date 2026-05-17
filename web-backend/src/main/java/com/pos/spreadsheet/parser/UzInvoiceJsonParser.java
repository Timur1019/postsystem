package com.pos.spreadsheet.parser;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.exception.BadRequestException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Парсер счёт-фактуры в JSON (Didox, Faktura.uz, произвольный массив позиций).
 */
@Component
public class UzInvoiceJsonParser {

    private static final String[] ITEM_ARRAY_KEYS = {
        "items", "products", "productlist", "product_list", "lines", "rows", "positions", "goods", "services"
    };

    private final ObjectMapper objectMapper;

    public UzInvoiceJsonParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public static boolean looksLikeJson(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return false;
        }
        int len = Math.min(bytes.length, 256);
        String start = new String(bytes, 0, len, StandardCharsets.UTF_8).trim();
        return start.startsWith("{") || start.startsWith("[");
    }

    public List<Map<String, String>> parse(byte[] bytes) {
        try {
            JsonNode root = objectMapper.readTree(bytes);
            List<JsonNode> itemNodes = collectItemNodes(root);
            List<Map<String, String>> rows = new ArrayList<>();
            int rowNum = 2;
            for (JsonNode item : itemNodes) {
                Map<String, String> row = mapItemNode(item, rowNum++);
                if (row != null) {
                    rows.add(row);
                }
            }
            if (rows.isEmpty()) {
                throw new BadRequestException(
                    "В JSON не найдено позиций товаров. Ожидается массив items/products с полями name, price, quantity."
                );
            }
            return rows;
        } catch (BadRequestException e) {
            throw e;
        } catch (IOException e) {
            throw new BadRequestException("Не удалось разобрать JSON: " + e.getMessage());
        }
    }

    public List<Map<String, String>> parse(InputStream in) throws IOException {
        return parse(in.readAllBytes());
    }

    private List<JsonNode> collectItemNodes(JsonNode root) {
        List<JsonNode> found = new ArrayList<>();
        if (root == null || root.isNull()) {
            return found;
        }
        if (root.isArray()) {
            for (JsonNode el : root) {
                collectItemsFromInvoiceWrapper(el, found);
            }
            if (!found.isEmpty()) {
                return found;
            }
            if (looksLikeProductArray(root)) {
                collectFromArray(root, found);
            }
            return found;
        }
        collectItemsFromInvoiceWrapper(root, found);
        for (String key : ITEM_ARRAY_KEYS) {
            JsonNode arr = findPathIgnoreCase(root, key);
            if (arr != null && arr.isArray()) {
                collectFromArray(arr, found);
            }
        }
        JsonNode invoices = findPathIgnoreCase(root, "invoices");
        if (invoices != null && invoices.isArray()) {
            for (JsonNode inv : invoices) {
                collectItemsFromInvoiceWrapper(inv, found);
            }
        }
        JsonNode documents = findPathIgnoreCase(root, "documents");
        if (documents != null && documents.isArray()) {
            for (JsonNode docWrap : documents) {
                collectItemsFromInvoiceWrapper(docWrap, found);
            }
        }
        collectDidoxRows(root, found);
        if (found.isEmpty()) {
            collectLikelyItemArrays(root, found, 0);
        }
        return found;
    }

    /** Faktura.uz / Didox: обёртка с document.items или плоская позиция. */
    private void collectItemsFromInvoiceWrapper(JsonNode node, List<JsonNode> found) {
        if (node == null || !node.isObject()) {
            return;
        }
        JsonNode document = findPathIgnoreCase(node, "document");
        if (document != null) {
            JsonNode items = findPathIgnoreCase(document, "items");
            if (items != null && items.isArray()) {
                collectFromArray(items, found);
                return;
            }
        }
        JsonNode content = findPathIgnoreCase(node, "content");
        if (content != null) {
            collectItemsFromInvoiceWrapper(content, found);
        }
        if (looksLikeProductObject(node)) {
            found.add(node);
        }
    }

    private static boolean looksLikeProductObject(JsonNode node) {
        return hasAnyField(node,
            "name", "description", "productName", "product_name", "title", "service_name", "nomi"
        ) && (hasAnyField(node, "price", "unit_price", "unitPrice", "selling_price", "subtotal")
            || hasAnyField(node, "volume", "quantity", "qty"));
    }

    private void collectDidoxRows(JsonNode node, List<JsonNode> found) {
        if (node == null) {
            return;
        }
        if (node.isObject()) {
            JsonNode itemRow = findPathIgnoreCase(node, "item_row");
            if (itemRow != null) {
                if (itemRow.isArray()) {
                    for (JsonNode row : itemRow) {
                        found.add(row);
                    }
                } else {
                    found.add(itemRow);
                }
            }
        }
        if (node.isArray()) {
            for (JsonNode child : node) {
                collectDidoxRows(child, found);
            }
        } else if (node.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                collectDidoxRows(fields.next().getValue(), found);
            }
        }
    }

    private void collectLikelyItemArrays(JsonNode node, List<JsonNode> found, int depth) {
        if (node == null || depth > 8 || found.size() > 500) {
            return;
        }
        if (node.isArray() && node.size() > 0 && looksLikeProductArray(node)) {
            collectFromArray(node, found);
            return;
        }
        if (node.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                collectLikelyItemArrays(fields.next().getValue(), found, depth + 1);
            }
        }
    }

    private boolean looksLikeProductArray(JsonNode array) {
        int checked = 0;
        for (JsonNode el : array) {
            if (!el.isObject()) {
                continue;
            }
            checked++;
            if (hasAnyField(el, "name", "description", "productname", "service_name", "title", "nomi")) {
                return true;
            }
            if (checked >= 3) {
                break;
            }
        }
        return false;
    }

    private void collectFromArray(JsonNode array, List<JsonNode> found) {
        for (JsonNode el : array) {
            if (el != null && el.isObject()) {
                found.add(el);
            }
        }
    }

    private Map<String, String> mapItemNode(JsonNode item, int rowNum) {
        if (item == null || !item.isObject()) {
            return null;
        }
        // Didox item_row: item_columns[].dynamic_item
        if (item.has("item_columns") || item.has("itemColumns")) {
            return mapDidoxItemRow(item, rowNum);
        }
        String name = firstText(item,
            "name", "productName", "product_name", "description", "title", "service_name",
            "serviceName", "productTitle", "nomi", "mahsulot", "goodName"
        );
        String ikpu = firstText(item,
            "ikpu", "ikpuCode", "ikpu_code", "catalogCode", "catalog_code", "mxik", "mxikCode",
            "identificationCode", "identification_code", "packageCode", "package_code"
        );
        String unit = firstText(item,
            "unit", "unitOfMeasure", "unit_of_measure", "measurement_unit", "measure", "olchov", "uom"
        );
        String qty = firstText(item,
            "quantity", "qty", "volume", "amount", "miqdor", "count", "product_count"
        );
        String price = firstText(item,
            "price", "unitPrice", "unit_price", "sellingPrice", "selling_price", "narx", "cost"
        );
        if (!StringUtils.hasText(price)) {
            price = firstText(item, "delivery_cost", "deliveryCost");
        }
        if (!StringUtils.hasText(price)) {
            price = firstText(item, "subtotal", "sum", "total", "lineTotal");
        }
        String vat = firstVat(item);
        return UzInvoiceProductRowMapper.toCatalogRow(name, ikpu, unit, qty, price, vat, rowNum);
    }

    private Map<String, String> mapDidoxItemRow(JsonNode item, int rowNum) {
        JsonNode columns = item.has("item_columns") ? item.get("item_columns") : item.get("itemColumns");
        if (columns == null) {
            return null;
        }
        String name = null;
        String ikpu = null;
        String unit = null;
        String qty = null;
        String price = null;
        String vat = null;

        Iterable<JsonNode> colNodes = columns.isArray() ? columns : List.of(columns);
        for (JsonNode col : colNodes) {
            JsonNode dynamic = col.has("dynamic_item") ? col.get("dynamic_item") : col.get("dynamicItem");
            if (dynamic == null) {
                continue;
            }
            Iterable<JsonNode> dynamics = dynamic.isArray() ? dynamic : List.of(dynamic);
            for (JsonNode d : dynamics) {
                String itemName = text(d.get("item_name"));
                if (itemName == null) {
                    itemName = text(d.get("itemName"));
                }
                String value = text(d.get("item_value"));
                if (value == null) {
                    value = text(d.get("itemValue"));
                }
                if (itemName == null || value == null) {
                    continue;
                }
                String key = itemName.toLowerCase(Locale.ROOT);
                if (key.contains("service_name") || key.contains("product") || key.contains("nomi")
                    || key.contains("description")) {
                    name = value;
                } else if (key.contains("ikpu") || key.contains("catalog") || key.contains("mxik")) {
                    ikpu = value;
                } else if (key.contains("quantity") || key.contains("miqdor") || key.contains("volume")) {
                    qty = value;
                } else if (key.contains("price") || key.contains("narx")) {
                    price = value;
                } else if (key.contains("unit") || key.contains("measure") || key.contains("olchov")) {
                    unit = value;
                } else if (key.contains("vat") || key.contains("qqs") || key.contains("nds")) {
                    vat = value;
                }
            }
        }
        return UzInvoiceProductRowMapper.toCatalogRow(name, ikpu, unit, qty, price, vat, rowNum);
    }

    private static String firstVat(JsonNode item) {
        JsonNode vat = item.get("vat");
        if (vat != null && vat.isObject()) {
            String rate = text(vat.get("vat_rate"));
            if (rate == null) {
                rate = text(vat.get("vatRate"));
            }
            if (rate != null) {
                return rate;
            }
        }
        return firstText(item, "vatRate", "vat_rate", "vatPercent", "taxRate", "tax_rate", "nds", "qqs");
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

    private static boolean hasAnyField(JsonNode node, String... keys) {
        for (String key : keys) {
            if (findPathIgnoreCase(node, key) != null) {
                return true;
            }
        }
        return false;
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
        if (node.isTextual()) {
            return node.asText().trim();
        }
        if (node.isNumber()) {
            return node.asText();
        }
        return null;
    }
}
