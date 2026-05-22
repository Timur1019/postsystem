package com.pos.service.imports;

import com.pos.dto.product.ProductImportPreviewRow;
import com.pos.entity.Product;
import com.pos.repository.ProductRepository;
import com.pos.spreadsheet.parser.UzInvoiceDocumentIdExtractor;
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

    @Mock
    ProductRepository productRepository;

    @Test
    void uzInvoice_firstImport_allRowsNew_evenWithSameIkpu() {
        Map<String, String> row1 = invoiceRow("Товар 1", "08470001002000000", "10000");
        Map<String, String> row2 = invoiceRow("Товар 2", "08470001002000000", "20000");

        ProductImportPreviewRow p1 = ProductImportSupport.toPreviewRow(
            2, row1, productRepository, ProductImportSource.UZ_INVOICE
        );
        ProductImportPreviewRow p2 = ProductImportSupport.toPreviewRow(
            3, row2, productRepository, ProductImportSource.UZ_INVOICE
        );

        assertEquals(ProductImportPreviewRow.STATUS_NEW, p1.status());
        assertEquals(ProductImportPreviewRow.STATUS_NEW, p2.status());
        verify(productRepository, never()).findFirstByUzInvoiceDocumentIdAndIsActiveTrue(anyString());
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

        ProductImportPreviewRow preview = ProductImportSupport.toPreviewRow(
            5, row, productRepository, ProductImportSource.UZ_INVOICE
        );

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

        ProductImportPreviewRow preview = ProductImportSupport.toPreviewRow(
            2, row, productRepository, ProductImportSource.CATALOG
        );

        assertEquals(ProductImportPreviewRow.STATUS_INVALID, preview.status());
        assertEquals("Не указан артикул (SKU)", preview.message());
    }

    @Test
    void rowDedupeKey_usesRowNumberOnly() {
        ProductImportPreviewRow row = new ProductImportPreviewRow(
            7, "IS-001-L-7", "Name", "123", "IS-001", "dona", 0,
            null, null, null,
            ProductImportPreviewRow.STATUS_NEW,
            null, null, null
        );
        assertEquals("row:7", ProductImportSupport.rowDedupeKey(row));
    }

    @Test
    void uzInvoice_withoutDocumentId_noInvoiceDuplicateCheck() {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("sku", "INV-2");
        row.put("name", "Молоко 1л");
        row.put("ikpu", "08470001002000000");
        row.put("selling_price", "12000");

        ProductImportPreviewRow preview = ProductImportSupport.toPreviewRow(
            2, row, productRepository, ProductImportSource.UZ_INVOICE
        );

        assertEquals(ProductImportPreviewRow.STATUS_NEW, preview.status());
        assertNull(preview.uzInvoiceDocumentId());
        verify(productRepository, never()).findFirstByUzInvoiceDocumentIdAndIsActiveTrue(anyString());
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
