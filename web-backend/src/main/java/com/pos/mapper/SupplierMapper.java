package com.pos.mapper;

import com.pos.dto.supplier.SupplierResponse;
import com.pos.entity.Supplier;
import org.mapstruct.Mapper;

@Mapper(config = PosMapperConfig.class)
public interface SupplierMapper {

    SupplierResponse toResponse(Supplier supplier);
}
