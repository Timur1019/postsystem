package com.pos.service;

import com.pos.dto.product.BulkTaxRateRequest;
import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.ProductExportPreviewRow;
import com.pos.dto.product.ProductExportRequest;
import com.pos.dto.product.ProductImportConfirmRequest;
import com.pos.dto.product.ProductImportPreviewResponse;
import com.pos.dto.product.ProductImportResponse;
import com.pos.dto.product.ProductResponse;
import com.pos.dto.product.UpdateProductRequest;

import java.math.BigDecimal;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.warehouse.WarehouseReceiveRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface ProductService {

    PageResponse<ProductResponse> getProducts(
        String search,
        Integer categoryId,
        boolean activeOnly,
        String deletedScope,
        Integer storeId,
        String ikpuStatus,
        Boolean markedProduct,
        Boolean soldIndividually,
        String barcodeExact,
        Pageable pageable
    );

    PageResponse<ProductResponse> getWarehouseProducts(
        String search,
        String barcodeContains,
        Boolean markedProduct,
        Pageable pageable
    );

    ProductResponse getProduct(UUID id);

    ProductResponse getByBarcode(String barcode);

    ProductResponse getByBarcode(String barcode, Integer storeId);

    ProductResponse createProduct(CreateProductRequest req);

    ProductResponse updateProduct(UUID id, UpdateProductRequest req);

    ProductResponse adjustStock(UUID id, int quantity, String movementType, String notes);

    ProductResponse receiveWarehouseStock(WarehouseReceiveRequest req);

    void deactivateProduct(UUID id);

    int bulkUpdateTaxRate(BulkTaxRateRequest req);

    int bulkDeactivateProducts(List<UUID> productIds);

    List<ProductResponse> getLowStockProducts();

    List<ProductExportPreviewRow> previewProductsExport(String storeIdsParam, BigDecimal markupPercent);

    byte[] exportProductsCatalogExcel(ProductExportRequest request);

    byte[] buildImportTemplateExcel();

    ProductImportPreviewResponse previewProductsImport(MultipartFile file, String source);

    ProductImportResponse importFromFile(MultipartFile file, ProductImportConfirmRequest options);
}
