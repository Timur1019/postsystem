package com.pos.service;

import com.pos.dto.returns.ReturnRowResponse;
import com.pos.dto.sale.SaleResponse;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface ReturnService {

    PageResponse<ReturnRowResponse> list(
        LocalDate from,
        LocalDate to,
        String cashierName,
        String fiscalSearch,
        Integer storeId,
        Pageable pageable
    );

    SaleResponse getDetails(UUID id);

    ReturnRowResponse updateReason(UUID id, String reason);

    void cancelReturn(UUID id);
}
