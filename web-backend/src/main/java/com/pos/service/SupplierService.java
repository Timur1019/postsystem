package com.pos.service;

import com.pos.dto.shared.PageResponse;
import com.pos.dto.supplier.CreateSupplierRequest;
import com.pos.dto.supplier.SupplierResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface SupplierService {

    PageResponse<SupplierResponse> list(String search, LocalDate createdOn, Pageable pageable);

    SupplierResponse create(CreateSupplierRequest req);
}
