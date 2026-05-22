package com.pos.service.stock;

import com.pos.dto.shared.PageResponse;
import com.pos.dto.warehouse.CreateStockTransferRequest;
import com.pos.dto.warehouse.StockTransferResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface StockTransferService {

    StockTransferResponse create(CreateStockTransferRequest request);

    StockTransferResponse getById(UUID id);

    PageResponse<StockTransferResponse> list(
        LocalDate from,
        LocalDate to,
        Integer fromStoreId,
        Integer toStoreId,
        Pageable pageable
    );
}
