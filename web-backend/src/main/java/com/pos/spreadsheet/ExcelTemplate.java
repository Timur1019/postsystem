package com.pos.spreadsheet;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Единый реестр шаблонов Excel: фиксированные колонки и заголовки для экспорта и импорта.
 */
public enum ExcelTemplate {

    PRODUCTS_CATALOG(
        "Номенклатура",
        List.of(
            col("sku", "Артикул (SKU) *"),
            col("name", "Наименование *"),
            col("category", "Категория"),
            col("selling_price", "Цена продажи"),
            col("cost_price", "Себестоимость"),
            col("tax_rate_percent_nds", "НДС %"),
            col("ikpu", "ИКПУ"),
            col("unit_of_measure", "Ед. изм."),
            col("barcode", "Штрихкод"),
            col("stock_quantity", "Остаток"),
            col("active", "Активен (1/0)")
        ),
        ExcelTemplate.sampleProductsRow()
    ),

    SALES_LEDGER_LINES(
        "Журнал продаж",
        List.of(
            col("receipt_number", "Номер чека"),
            col("sale_id", "ID продажи"),
            col("created_at", "Дата и время"),
            col("status", "Статус"),
            col("cashier", "Кассир"),
            col("store", "Магазин"),
            col("shift_id", "ID смены"),
            col("shift_opened_at", "Смена открыта"),
            col("shift_closed_at", "Смена закрыта"),
            col("shift_status", "Статус смены"),
            col("shift_z_report_id", "Z-отчёт (ID)"),
            col("payment_method", "Способ оплаты"),
            col("product_sku", "Артикул"),
            col("product_name", "Товар"),
            col("ikpu", "ИКПУ"),
            col("quantity", "Кол-во"),
            col("unit_price", "Цена"),
            col("line_discount", "Скидка строки"),
            col("tax_amount", "НДС (сумма)"),
            col("tax_rate_percent", "НДС %"),
            col("line_total", "Сумма строки")
        ),
        null
    ),

    Z_REPORTS_LIST(
        "Z-отчёты",
        List.of(
            col("fiscal_card_id", "Номер фискальной карты"),
            col("opened_at", "Дата и время открытия"),
            col("closed_at", "Дата и время закрытия"),
            col("z_number", "Номер Z-отчёта"),
            col("total_amount", "Общая сумма"),
            col("vat_amount", "Сумма НДС"),
            col("store_name", "Магазин"),
            col("terminal_serial", "Серийный номер терминала"),
            col("employee_name", "Сотрудник")
        ),
        null
    ),

    RETURNS_JOURNAL(
        "Журнал возвратов",
        List.of(
            col("created_at", "Дата и время"),
            col("fiscal_module_id", "ID фискального модуля"),
            col("total_amount", "Сумма"),
            col("positions_count", "Позиций в чеке"),
            col("store_name", "Магазин"),
            col("cashier_name", "Кассир"),
            col("reason", "Причина"),
            col("status", "Статус")
        ),
        null
    ),

    CASH_TRANSFER_JOURNAL(
        "Передача кассы",
        List.of(
            col("store_name", "Магазин"),
            col("register_number", "№ кассы"),
            col("opened_at", "Дата открытия"),
            col("closed_at", "Дата закрытия"),
            col("cashier_name", "Кассир"),
            col("sales_count", "Продаж, шт."),
            col("total_amount", "Итого"),
            col("payment_cash", "Наличные"),
            col("payment_card", "Карта"),
            col("payment_non_cash", "Безнал"),
            col("returns_count", "Возвратов, шт."),
            col("returns_total", "Сумма возвратов"),
            col("returns_cash", "Возврат наличными"),
            col("returns_card", "Возврат картой"),
            col("returns_non_cash", "Безнал. возврат")
        ),
        null
    ),

    Z_REPORT_SALES_LINES(
        "Продажи Z-отчёта",
        List.of(
            col("created_at", "Дата и время чека"),
            col("receipt_number", "Номер чека"),
            col("cashier", "Кассир"),
            col("payment_method", "Способ оплаты"),
            col("sale_total", "Сумма чека"),
            col("product_name", "Товар"),
            col("product_sku", "Артикул"),
            col("ikpu", "ИКПУ"),
            col("quantity", "Кол-во"),
            col("unit_price", "Цена"),
            col("line_discount", "Скидка строки"),
            col("tax_amount", "НДС (сумма)"),
            col("tax_rate_percent", "НДС %"),
            col("line_total", "Сумма строки")
        ),
        null
    );

    private final String sheetName;
    private final List<ExcelColumn> columns;
    private final Map<String, String> sampleRow;

    ExcelTemplate(String sheetName, List<ExcelColumn> columns, Map<String, String> sampleRow) {
        this.sheetName = sheetName;
        this.columns = List.copyOf(columns);
        this.sampleRow = sampleRow == null ? null : Map.copyOf(sampleRow);
    }

    public String sheetName() {
        return sheetName;
    }

    public List<ExcelColumn> columns() {
        return columns;
    }

    public Map<String, String> sampleRow() {
        return sampleRow;
    }

    public Set<String> columnKeys() {
        return columns.stream().map(ExcelColumn::key).collect(Collectors.toSet());
    }

    public Set<String> requiredImportKeys() {
        if (this == PRODUCTS_CATALOG) {
            return Set.of("sku", "name");
        }
        return Set.of();
    }

    private static ExcelColumn col(String key, String header) {
        return new ExcelColumn(key, header);
    }

    private static Map<String, String> sampleProductsRow() {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("sku", "SKU-DEMO-1");
        row.put("name", "Пример товара");
        row.put("category", "");
        row.put("selling_price", "15000");
        row.put("cost_price", "10000");
        row.put("tax_rate_percent_nds", "12");
        row.put("ikpu", "");
        row.put("unit_of_measure", "шт");
        row.put("barcode", "");
        row.put("stock_quantity", "0");
        row.put("active", "1");
        return row;
    }
}
