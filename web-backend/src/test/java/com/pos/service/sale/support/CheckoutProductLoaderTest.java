package com.pos.service.sale.support;

import com.pos.dto.sale.SaleItemRequest;
import com.pos.entity.Company;
import com.pos.entity.Product;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.ProductRepository;
import com.pos.service.support.TenantAccessSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CheckoutProductLoaderTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private TenantAccessSupport tenantAccess;

    @InjectMocks
    private CheckoutProductLoader loader;

    @Test
    void loadIndexed_batchesDistinctProductIds() {
        UUID id = UUID.randomUUID();
        Company company = Company.builder().id(1).build();
        Product product = Product.builder()
            .id(id)
            .name("Milk")
            .isActive(true)
            .company(company)
            .build();

        when(productRepository.findAllByIdWithCompany(List.of(id))).thenReturn(List.of(product));

        var result = loader.loadIndexed(List.of(
            new SaleItemRequest(id, BigDecimal.ONE, null, null),
            new SaleItemRequest(id, BigDecimal.valueOf(2), null, null)
        ));

        assertThat(result).containsKey(id);
        verify(productRepository).findAllByIdWithCompany(List.of(id));
        verify(tenantAccess).assertProductBelongsToTenant(product);
    }

    @Test
    void loadIndexed_throwsWhenProductMissing() {
        UUID id = UUID.randomUUID();
        when(productRepository.findAllByIdWithCompany(any())).thenReturn(List.of());

        assertThatThrownBy(() -> loader.loadIndexed(List.of(
            new SaleItemRequest(id, BigDecimal.ONE, null, null)
        ))).isInstanceOf(ResourceNotFoundException.class);
    }
}
