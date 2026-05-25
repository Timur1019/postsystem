package com.pos.service.imports.source;

import com.pos.dto.product.ProductImportPreviewRow;
import com.pos.service.imports.ProductImportParseOptions;
import com.pos.service.imports.ProductImportSource;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * Контракт обработчика одного источника импорта (каталог, e-счёт-фактура UZ, и т.д.).
 * Новый источник = новая реализация интерфейса, без правок существующих обработчиков.
 */
public interface ProductImportSourceHandler {

    ProductImportSource source();

    List<Map<String, String>> parseSpreadsheet(InputStream in) throws IOException;

    List<Map<String, String>> parseJson(byte[] bytes);

    /** Номер документа/фактуры на уровне файла, либо null если источник не оперирует таким понятием. */
    String resolveFileInvoiceId(List<Map<String, String>> rows);

    /** Был ли уже импортирован файл с этим номером документа. По умолчанию false (источник не отслеживает файлы). */
    default boolean isFileAlreadyImported(String fileInvoiceId) {
        return false;
    }

    /** Превращает одну строку файла в preview-строку c учётом правил источника (валидация, поиск дубликата). */
    ProductImportPreviewRow toPreviewRow(int rowNum, Map<String, String> row, ProductImportParseOptions options);
}
