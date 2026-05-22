package com.pos.service.stock;

import com.pos.dto.shared.PageResponse;
import com.pos.dto.warehouse.CreateStockInventoryRequest;
import com.pos.dto.warehouse.StockInventoryResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface StockInventoryService {

    StockInventoryResponse create(CreateStockInventoryRequest request);

    StockInventoryResponse getById(UUID id);

    PageResponse<StockInventoryResponse> list(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    );
}
