package com.pos.mapper;

import com.pos.dto.store.StoreResponse;
import com.pos.entity.Store;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface StoreMapper {

    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.name")
    StoreResponse toResponse(Store store);

    List<StoreResponse> toResponseList(List<Store> stores);
}
