package com.pos.mapper;

import com.pos.dto.customer.CustomerResponse;
import com.pos.entity.Customer;
import org.mapstruct.Mapper;

@Mapper(config = PosMapperConfig.class)
public interface CustomerMapper {

    CustomerResponse toResponse(Customer customer);
}
