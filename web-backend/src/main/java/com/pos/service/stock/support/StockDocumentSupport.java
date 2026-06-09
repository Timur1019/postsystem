package com.pos.service.stock.support;

import com.pos.entity.Product;
import com.pos.exception.PosExceptions;
import com.pos.repository.ProductRepository;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Общие проверки для складских документов (приёмка, инвентаризация, перемещение).
 */
@Component
@RequiredArgsConstructor
public class StockDocumentSupport {

    private final ProductRepository productRepository;

    public void requireLines(List<?> lines) {
        if (lines == null || lines.isEmpty()) {
            throw PosExceptions.badRequest("Add at least one line");
        }
    }

    public void requireCompanyContext(Integer companyId) {
        if (companyId == null) {
            throw PosExceptions.badRequest("Company context is required");
        }
    }

    public Product requireActiveProduct(UUID productId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> PosExceptions.notFound("Product", productId));
        if (!product.isActive()) {
            throw PosExceptions.badRequest("Product is not active: " + product.getName());
        }
        return product;
    }

    public void requirePositiveQuantity(BigDecimal quantity) {
        if (QuantityUtil.normalize(quantity).signum() <= 0) {
            throw PosExceptions.badRequest("Quantity must be greater than zero");
        }
    }
}
