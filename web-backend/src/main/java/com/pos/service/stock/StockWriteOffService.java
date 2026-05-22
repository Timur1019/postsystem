package com.pos.service.stock;

import com.pos.dto.stock.CreateWriteOffRequest;
import com.pos.dto.stock.WriteOffRowResponse;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface StockWriteOffService {

    WriteOffRowResponse create(CreateWriteOffRequest request);

    PageResponse<WriteOffRowResponse> list(LocalDate from, LocalDate to, Integer storeId, Pageable pageable);
}
