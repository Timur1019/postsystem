package com.pos.service;

import com.pos.dto.cashregister.CashRegisterConfigFormOptionsResponse;
import com.pos.dto.cashregister.CashRegisterConfigRowResponse;
import com.pos.dto.cashregister.CreateCashRegisterConfigRequest;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

public interface CashRegisterConfigService {

    PageResponse<CashRegisterConfigRowResponse> list(
        String search,
        Integer storeId,
        String equipmentSerial,
        Pageable pageable
    );

    CashRegisterConfigRowResponse create(CreateCashRegisterConfigRequest request);

    CashRegisterConfigRowResponse update(Long id, CreateCashRegisterConfigRequest request);

    void delete(Long id);

    CashRegisterConfigFormOptionsResponse getFormOptions();
}
