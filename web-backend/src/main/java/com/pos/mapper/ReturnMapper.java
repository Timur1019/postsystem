package com.pos.mapper;

import com.pos.dto.returns.ReturnRowResponse;
import com.pos.entity.Sale;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = PosMapperConfig.class)
public interface ReturnMapper {

    @Mapping(target = "fiscalModuleId", source = "sale.receiptNumber")
    @Mapping(target = "positionsCount", source = "positionsCount")
    @Mapping(target = "storeName", constant = "—")
    ReturnRowResponse toRowResponse(Sale sale, int positionsCount);
}
