package com.pos.service.product.impl;

import com.pos.domain.ProductType;
import com.pos.domain.SaleType;
import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.ProductResponse;
import com.pos.entity.Company;
import com.pos.entity.Product;
import com.pos.exception.BadRequestException;
import com.pos.repository.CategoryRepository;
import com.pos.repository.ProductRepository;
import com.pos.service.ProductAttributeService;
import com.pos.service.UnitCatalogService;
import com.pos.service.product.ProductExtensionService;
import com.pos.service.product.ProductResponseAssembler;
import com.pos.service.product.support.ProductBarcodeValidator;
import com.pos.service.product.support.ProductInitialStockSupport;
import com.pos.service.product.support.ProductStorePriceApplier;
import com.pos.service.support.ProductLookupSupport;
import com.pos.service.support.TenantAccessSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductCreateHandlerTest {

    private static final Integer COMPANY_ID = 7;

    @Mock private ProductRepository productRepository;
    @Mock private ProductLookupSupport productLookup;
    @Mock private CategoryRepository categoryRepository;
    @Mock private TenantAccessSupport tenantAccess;
    @Mock private ProductBarcodeValidator barcodeValidator;
    @Mock private ProductStorePriceApplier storePriceApplier;
    @Mock private ProductInitialStockSupport initialStockSupport;
    @Mock private ProductExtensionService extensionService;
    @Mock private UnitCatalogService unitCatalogService;
    @Mock private ProductAttributeService productAttributeService;
    @Mock private ProductResponseAssembler assembler;

    @InjectMocks
    private ProductCreateHandler handler;

    @Test
    void create_duplicateActiveSku_throws() {
        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(COMPANY_ID);
        Product existing = Product.builder()
            .sku("SKU-1")
            .isActive(true)
            .company(Company.builder().id(COMPANY_ID).build())
            .build();
        when(productLookup.findOne(any())).thenReturn(Optional.of(existing));

        assertThrows(BadRequestException.class, () -> handler.create(sampleRequest("SKU-1")));
    }

    @Test
    void create_happyPath_persistsAndReturnsResponse() {
        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(COMPANY_ID);
        when(productLookup.findOne(any())).thenReturn(Optional.empty());
        when(tenantAccess.requireCompany(COMPANY_ID)).thenReturn(Company.builder().id(COMPANY_ID).name("Co").loginCode("c1").build());

        UUID productId = UUID.randomUUID();
        Product saved = Product.builder().id(productId).sku("SKU-NEW").company(Company.builder().id(COMPANY_ID).build()).build();
        when(productRepository.save(any(Product.class))).thenReturn(saved);

        ProductResponse expected = minimalResponse(productId, "SKU-NEW");
        when(assembler.toResponse(saved)).thenReturn(expected);

        ProductResponse result = handler.create(sampleRequest("SKU-NEW"));

        assertThat(result).isEqualTo(expected);
        verify(barcodeValidator).validateForCreate(eq(COMPANY_ID), eq(null), eq(null));
        verify(productAttributeService).saveAttributes(eq(productId), eq(null), eq(null));
    }

    private static CreateProductRequest sampleRequest(String sku) {
        return new CreateProductRequest(
            sku,
            "Product name",
            null,
            null,
            BigDecimal.ONE,
            BigDecimal.TEN,
            null,
            BigDecimal.ZERO,
            ProductType.RETAIL,
            null,
            SaleType.PIECE,
            null,
            null,
            null,
            null,
            10,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
        );
    }

    private static ProductResponse minimalResponse(UUID id, String sku) {
        return new ProductResponse(
            id,
            sku,
            "Product name",
            null,
            null,
            null,
            BigDecimal.ONE,
            BigDecimal.TEN,
            null,
            BigDecimal.ZERO,
            ProductType.RETAIL,
            null,
            SaleType.PIECE,
            null,
            0,
            false,
            BigDecimal.ZERO,
            0,
            10,
            false,
            null,
            List.of(),
            null,
            true,
            Instant.now(),
            null,
            null,
            null,
            "pcs",
            null,
            null,
            false,
            false,
            null,
            "OWN",
            null,
            null,
            0,
            List.of(),
            null,
            null,
            null,
            null,
            Map.of()
        );
    }
}
