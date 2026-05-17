package com.pos.controller;

import com.pos.dto.product.ProductResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.warehouse.WarehouseReceiveRequest;
import com.pos.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Складской UI: те же товары и поле {@code stock_quantity}, что и {@code /products}.
 * Отдельный префикс — удобные фильтры (штрихкод, маркировка); БД одна.
 */
@RestController
@RequestMapping("/warehouse")
@RequiredArgsConstructor
public class WarehouseController {

    private final ProductService productService;

    @GetMapping("/products")
    public ResponseEntity<PageResponse<ProductResponse>> listWarehouseProducts(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String barcode,
        @RequestParam(required = false) Boolean markedProduct,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(productService.getWarehouseProducts(search, barcode, markedProduct, pageable));
    }

    @PostMapping("/receipt")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProductResponse> receiveStock(@Valid @RequestBody WarehouseReceiveRequest request) {
        return ResponseEntity.ok(productService.receiveWarehouseStock(request));
    }
}
