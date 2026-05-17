package com.pos.service.imports;

import com.pos.dto.product.ProductImportConfirmRequest;
import com.pos.dto.product.ProductImportPreviewResponse;
import com.pos.dto.product.ProductImportResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ProductImportService {

    ProductImportPreviewResponse preview(MultipartFile file, String source);

    ProductImportResponse importFile(MultipartFile file, ProductImportConfirmRequest options);
}
