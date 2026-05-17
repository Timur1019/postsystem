package com.pos.service;

import com.pos.dto.returns.ReturnRowResponse;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface ReturnService {

    PageResponse<ReturnRowResponse> list(
        LocalDate from,
        LocalDate to,
        String cashierName,
        String fiscalSearch,
        Pageable pageable
    );
}
