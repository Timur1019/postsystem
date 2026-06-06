package com.pos.service.product;

import com.pos.domain.ProductType;
import com.pos.domain.SaleType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProductTypeSupportTest {

    @Test
    void resolve_defaultsToRetail() {
        assertEquals(ProductType.RETAIL, ProductTypeSupport.resolve(null, SaleType.PIECE));
        assertEquals(ProductType.RETAIL, ProductTypeSupport.resolve(null, SaleType.WEIGHT));
    }

    @Test
    void resolve_serviceSaleType() {
        assertEquals(ProductType.SERVICE, ProductTypeSupport.resolve(null, SaleType.SERVICE));
    }

    @Test
    void resolve_explicitTypeWins() {
        assertEquals(ProductType.MATERIAL, ProductTypeSupport.resolve(ProductType.MATERIAL, SaleType.PIECE));
    }
}
