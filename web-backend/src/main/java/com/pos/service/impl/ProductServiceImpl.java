package com.pos.service.impl;

import com.pos.dto.product.BulkTaxRateRequest;
import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.ProductExportPreviewRow;
import com.pos.dto.product.ProductExportRequest;
import com.pos.dto.product.ProductImportConfirmRequest;
import com.pos.dto.product.ProductImportPreviewResponse;
import com.pos.dto.product.ProductImportResponse;
import com.pos.dto.product.ProductResponse;
import com.pos.dto.product.UpdateProductRequest;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.warehouse.WarehouseReceiveRequest;
import com.pos.service.ProductService;
import com.pos.service.export.ProductExportService;
import com.pos.service.imports.ProductImportService;
import com.pos.service.product.ProductCommandService;
import com.pos.service.product.ProductQueryService;
import com.pos.service.product.ProductStockService;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Фасад {@link ProductService}: делегирует чтение, команды и склад отдельным сервисам.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductQueryService queryService;
    private final ProductCommandService commandService;
    private final ProductStockService stockService;
    private final ProductExportService productExportService;
    private final ProductImportService productImportService;

    @Override
    public PageResponse<ProductResponse> getProducts(
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
    ) {
        return queryService.getProducts(
            search, categoryId, activeOnly, deletedScope, storeId,
            ikpuStatus, markedProduct, soldIndividually, barcodeExact, pageable
        );
    }

    @Override
    public PageResponse<ProductResponse> getWarehouseProducts(
        String search,
        String barcodeContains,
        Boolean markedProduct,
        Pageable pageable
    ) {
        return queryService.getWarehouseProducts(search, barcodeContains, markedProduct, pageable);
    }

    @Override
    public ProductResponse getProduct(UUID id) {
        return queryService.getProduct(id);
    }

    @Override
    public ProductResponse getByBarcode(String barcode) {
        return queryService.getByBarcode(barcode);
    }

    @Override
    public ProductResponse getByBarcode(String barcode, Integer storeId) {
        return queryService.getByBarcode(barcode, storeId);
    }

    @Override
    public List<ProductResponse> getLowStockProducts() {
        return queryService.getLowStockProducts();
    }

    @Override
    @Transactional
    public ProductResponse createProduct(CreateProductRequest req) {
        return commandService.createProduct(req);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(UUID id, UpdateProductRequest req) {
        return commandService.updateProduct(id, req);
    }

    @Override
    @Transactional
    public void deactivateProduct(UUID id) {
        commandService.deactivateProduct(id);
    }

    @Override
    @Transactional
    public int bulkUpdateTaxRate(BulkTaxRateRequest req) {
        return commandService.bulkUpdateTaxRate(req);
    }

    @Override
    @Transactional
    public int bulkDeactivateProducts(List<UUID> productIds) {
        return commandService.bulkDeactivateProducts(productIds);
    }

    @Override
    @Transactional
    public ProductResponse adjustStock(UUID id, int quantity, String movementType, String notes) {
        return stockService.adjustStock(id, quantity, movementType, notes);
    }

    @Override
    @Transactional
    public ProductResponse receiveWarehouseStock(WarehouseReceiveRequest req) {
        return stockService.receiveWarehouseStock(req);
    }

    @Override
    public List<ProductExportPreviewRow> previewProductsExport(String storeIdsParam, BigDecimal markupPercent) {
        return productExportService.previewExport(storeIdsParam, markupPercent);
    }

    @Override
    public byte[] exportProductsCatalogExcel(ProductExportRequest request) {
        return productExportService.exportCatalogExcel(request);
    }

    @Override
    public byte[] buildImportTemplateExcel() {
        return productExportService.buildImportTemplateExcel();
    }

    @Override
    public ProductImportPreviewResponse previewProductsImport(MultipartFile file, String source) {
        return productImportService.preview(file, source);
    }

    @Override
    public ProductImportResponse importFromFile(MultipartFile file, ProductImportConfirmRequest options) {
        ProductImportResponse result = productImportService.importFile(file, options);
        LogUtil.info(
            ProductServiceImpl.class,
            "Product import finished: created={}, skipped={}, errorCount={}",
            result.created(),
            result.skipped(),
            result.errors().size()
        );
        return result;
    }
}
