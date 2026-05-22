package com.pos.service.product.lifecycle;

import com.pos.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProductLifecycleMovementTypeFilterTest {

    @Test
    void allReturnsNull() {
        assertNull(ProductLifecycleMovementTypeFilter.normalize("ALL"));
        assertNull(ProductLifecycleMovementTypeFilter.normalize(null));
    }

    @Test
    void normalizesKnownType() {
        assertEquals("SALE", ProductLifecycleMovementTypeFilter.normalize("sale"));
    }

    @Test
    void rejectsUnknownType() {
        assertThrows(
            BadRequestException.class,
            () -> ProductLifecycleMovementTypeFilter.normalize("UNKNOWN")
        );
    }
}
