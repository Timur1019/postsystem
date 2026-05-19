package com.pos.service;

import com.pos.dto.cashregister.CashTransferRowResponse;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface CashTransferService {

    PageResponse<CashTransferRowResponse> list(
        String storeSearch,
        Integer registerNumber,
        LocalDate closedFrom,
        LocalDate closedTo,
        Pageable pageable
    );

    List<CashTransferRowResponse> listAll(
        String storeSearch,
        Integer registerNumber,
        LocalDate closedFrom,
        LocalDate closedTo
    );
}
