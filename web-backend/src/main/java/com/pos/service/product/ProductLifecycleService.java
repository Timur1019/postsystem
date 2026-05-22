package com.pos.service.product;

import com.pos.dto.product.ProductLifecycleResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface ProductLifecycleService {

    ProductLifecycleResponse lifecycle(
        UUID productId,
        LocalDate from,
        LocalDate to,
        String movementType,
        Integer storeId,
        Pageable pageable
    );
}
