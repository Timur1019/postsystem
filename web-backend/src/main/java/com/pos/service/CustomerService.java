package com.pos.service;

import com.pos.dto.customer.CreateCustomerRequest;
import com.pos.dto.customer.CustomerResponse;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

public interface CustomerService {

    PageResponse<CustomerResponse> list(String search, Pageable pageable);

    CustomerResponse create(CreateCustomerRequest request);
}
