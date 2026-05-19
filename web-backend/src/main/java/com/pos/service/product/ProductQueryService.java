package com.pos.service.product;

import com.pos.dto.product.ProductResponse;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

public interface ProductQueryService {

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

    ProductResponse getProduct(java.util.UUID id);

    ProductResponse getByBarcode(String barcode);

    ProductResponse getByBarcode(String barcode, Integer storeId);

    java.util.List<ProductResponse> getLowStockProducts();
}
