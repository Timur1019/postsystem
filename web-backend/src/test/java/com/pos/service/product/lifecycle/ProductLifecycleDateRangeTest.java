package com.pos.service.product.lifecycle;

import com.pos.entity.Product;
import com.pos.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProductLifecycleDateRangeTest {

    @Test
    void resolvesDefaultsWhenDatesNull() {
        Product product = Product.builder()
            .createdAt(Instant.parse("2024-06-15T10:00:00Z"))
            .build();

        ProductLifecycleDateRange range = ProductLifecycleDateRange.resolve(null, null, product);

        assertEquals(LocalDate.of(2024, 6, 15), range.from());
    }

    @Test
    void rejectsFromAfterTo() {
        Product product = Product.builder().build();

        assertThrows(
            BadRequestException.class,
            () -> ProductLifecycleDateRange.resolve(
                LocalDate.of(2025, 5, 10),
                LocalDate.of(2025, 5, 1),
                product
            )
        );
    }
}
