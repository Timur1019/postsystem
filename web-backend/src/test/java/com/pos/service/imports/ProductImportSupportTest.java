package com.pos.service.imports;

import com.pos.dto.product.ProductImportPreviewRow;
import com.pos.entity.Product;
import com.pos.repository.ProductRepository;
import com.pos.service.imports.source.CatalogImportSourceHandler;
import com.pos.service.imports.source.UzInvoiceImportSourceHandler;
import com.pos.spreadsheet.ExcelSpreadsheetReader;
import com.pos.spreadsheet.parser.CatalogJsonParser;
import com.pos.spreadsheet.parser.UzInvoiceDocumentIdExtractor;
import com.pos.spreadsheet.parser.UzInvoiceJsonParser;
import com.pos.spreadsheet.parser.UzInvoiceSpreadsheetParser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductImportSupportTest {

    @Mock ProductRepository productRepository;
    @Mock ExcelSpreadsheetReader excelSpreadsheetReader;
    @Mock CatalogJsonParser catalogJsonParser;
    @Mock UzInvoiceSpreadsheetParser uzInvoiceSpreadsheetParser;
    @Mock UzInvoiceJsonParser uzInvoiceJsonParser;

    private CatalogImportSourceHandler catalog;
    private UzInvoiceImportSourceHandler uzInvoice;

    private static final ProductImportParseOptions DEFAULT_OPTS = ProductImportParseOptions.defaults();

    @BeforeEach
    void setUp() {
        catalog = new CatalogImportSourceHandler(excelSpreadsheetReader, catalogJsonParser, productRepository);
        uzInvoice = new UzInvoiceImportSourceHandler(uzInvoiceSpreadsheetParser, uzInvoiceJsonParser, productRepository);
    }

    @Test
    void uzInvoice_firstImport_allRowsNew_evenWithSameIkpu() {
        when(productRepository.findFirstByUzInvoiceDocumentIdAndIsActiveTrue("IS-00008429"))
            .thenReturn(Optional.empty());
        when(productRepository.existsBySkuStartingWithAndIsActiveTrue("IS-00008429-L-"))
            .thenReturn(false);

        Map<String, String> row1 = invoiceRow("Товар 1", "08470001002000000", "10000");
        Map<String, String> row2 = invoiceRow("Товар 2", "08470001002000000", "20000");

        ProductImportPreviewRow p1 = uzInvoice.toPreviewRow(2, row1, DEFAULT_OPTS);
        ProductImportPreviewRow p2 = uzInvoice.toPreviewRow(3, row2, DEFAULT_OPTS);

        assertEquals(ProductImportPreviewRow.STATUS_NEW, p1.status());
        assertEquals(ProductImportPreviewRow.STATUS_NEW, p2.status());
    }

    @Test
    void uzInvoice_reimport_marksDuplicateByInvoiceIdOnly() {
        Map<String, String> row = invoiceRow("Молоко 1л", "08470001002000000", "12000");

        Product existing = Product.builder()
            .sku("IS-00008429-L-5")
            .name("Другая позиция")
            .ikpu("99999999999999999")
            .uzInvoiceDocumentId("IS-00008429")
            .isActive(true)
            .build();

        when(productRepository.findFirstByUzInvoiceDocumentIdAndIsActiveTrue("IS-00008429"))
            .thenReturn(Optional.of(existing));

        ProductImportPreviewRow preview = uzInvoice.toPreviewRow(5, row, DEFAULT_OPTS);

        assertEquals(ProductImportPreviewRow.STATUS_DUPLICATE, preview.status());
        assertEquals("Счёт-фактура IS-00008429 уже импортирована", preview.message());
        verify(productRepository, never()).findByUzInvoiceDocumentIdAndSkuAndIsActiveTrue(anyString(), anyString());
        verify(productRepository, never()).existsByIkpuAndIsActiveTrue(anyString());
    }

    @Test
    void catalog_stillRequiresSku() {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("name", "Товар без SKU");
        row.put("selling_price", "1000");

        ProductImportPreviewRow preview = catalog.toPreviewRow(2, row, DEFAULT_OPTS);

        assertEquals(ProductImportPreviewRow.STATUS_INVALID, preview.status());
        assertEquals("Не указан артикул (SKU)", preview.message());
    }

    @Test
    void rowDedupeKey_usesRowNumberOnly() {
        ProductImportPreviewRow row = new ProductImportPreviewRow(
            7, "IS-001-L-7", "Name", "123", "A-1", "IS-001", "dona", 0,
            null, null, null,
            ProductImportPreviewRow.STATUS_NEW,
            null, null, null
        );
        assertEquals("row:7", ProductImportSupport.rowDedupeKey(row));
    }

    @Test
    void uzInvoice_reimport_duplicateBySkuPrefixWhenDocIdMissingOnProduct() {
        Map<String, String> row = invoiceRow("Молоко 1л", "08470001002000000", "12000");

        Product existing = Product.builder()
            .sku("IS-00012026-L-2")
            .name("Старая позиция")
            .isActive(true)
            .build();

        when(productRepository.findFirstByUzInvoiceDocumentIdAndIsActiveTrue("IS-00008429"))
            .thenReturn(Optional.empty());
        when(productRepository.existsBySkuStartingWithAndIsActiveTrue("IS-00008429-L-"))
            .thenReturn(true);
        when(productRepository.findFirstBySkuStartingWithAndIsActiveTrueOrderBySkuAsc("IS-00008429-L-"))
            .thenReturn(Optional.of(existing));

        ProductImportPreviewRow preview = uzInvoice.toPreviewRow(2, row, DEFAULT_OPTS);

        assertEquals(ProductImportPreviewRow.STATUS_DUPLICATE, preview.status());
        assertEquals("Счёт-фактура IS-00008429 уже импортирована", preview.message());
    }

    @Test
    void uzInvoice_withoutDocumentId_noInvoiceDuplicateCheck() {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("sku", "INV-2");
        row.put("name", "Молоко 1л");
        row.put("ikpu", "08470001002000000");
        row.put("selling_price", "12000");

        ProductImportPreviewRow preview = uzInvoice.toPreviewRow(2, row, DEFAULT_OPTS);

        assertEquals(ProductImportPreviewRow.STATUS_NEW, preview.status());
        assertNull(preview.uzInvoiceDocumentId());
        verify(productRepository, never()).findFirstByUzInvoiceDocumentIdAndIsActiveTrue(anyString());
    }

    @Test
    void storageLocation_fromFileAndDefault() {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("sku", "SKU-2");
        row.put("name", "Товар 2");
        row.put("storage_location", "Полка B");
        row.put("selling_price", "3000");

        ProductImportPreviewRow fromFile = catalog.toPreviewRow(2, row, DEFAULT_OPTS);
        assertEquals("Полка B", fromFile.storageLocation());

        row.remove("storage_location");
        ProductImportPreviewRow fromDefault = catalog.toPreviewRow(
            3, row, new ProductImportParseOptions("Зона A")
        );
        assertEquals("Зона A", fromDefault.storageLocation());
    }

    private static Map<String, String> invoiceRow(String name, String ikpu, String price) {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("name", name);
        row.put("ikpu", ikpu);
        row.put("selling_price", price);
        row.put(UzInvoiceDocumentIdExtractor.ROW_KEY_UZ_INVOICE_DOCUMENT_ID, "IS-00008429");
        return row;
    }
}
