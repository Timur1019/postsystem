package com.pos.service.sale.support;

import com.pos.dto.sale.SaleItemRequest;
import com.pos.entity.Product;
import com.pos.exception.PosExceptions;
import com.pos.repository.ProductRepository;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class CheckoutProductLoader {

    private final ProductRepository productRepository;
    private final TenantAccessSupport tenantAccess;

    public Map<UUID, Product> loadIndexed(List<SaleItemRequest> lineItems) {
        List<UUID> ids = lineItems.stream()
            .map(SaleItemRequest::productId)
            .distinct()
            .toList();

        Map<UUID, Product> byId = productRepository.findAllByIdWithCompany(ids).stream()
            .collect(Collectors.toMap(Product::getId, Function.identity(), (a, b) -> a, LinkedHashMap::new));

        for (UUID id : ids) {
            Product product = byId.get(id);
            if (product == null) {
                throw PosExceptions.notFound("Product", id);
            }
            if (!product.isActive()) {
                throw PosExceptions.badRequest("Product is inactive: " + product.getName());
            }
            tenantAccess.assertProductBelongsToTenant(product);
        }
        return byId;
    }
}
