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
    @Mapping(target = "businessType", expression = "java(store.getBusinessType() != null ? store.getBusinessType().name() : com.pos.domain.BusinessType.UNIVERSAL.name())")
    StoreResponse toResponse(Store store);

    List<StoreResponse> toResponseList(List<Store> stores);
}
