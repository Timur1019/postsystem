package com.pos.service.stock;

import com.pos.dto.shared.PageResponse;
import com.pos.dto.warehouse.CreateStockReceiptRequest;
import com.pos.dto.warehouse.StockReceiptResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface StockReceiptService {

    StockReceiptResponse create(CreateStockReceiptRequest request);

    StockReceiptResponse getById(UUID id);

    PageResponse<StockReceiptResponse> list(LocalDate from, LocalDate to, Integer storeId, Pageable pageable);
}
