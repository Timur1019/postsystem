package com.pos.service;

import com.pos.dto.cashregister.CashRegisterDetailResponse;
import com.pos.dto.cashregister.CashRegisterRowResponse;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CashRegisterService {

    PageResponse<CashRegisterRowResponse> list(
        String storeSearch,
        String equipmentModel,
        String equipmentSerial,
        String fiscalCardId,
        Pageable pageable
    );

    List<String> listDistinctEquipmentSerials();

    CashRegisterRowResponse toggleStatus(Long id);

    CashRegisterDetailResponse getById(Long id);
}
