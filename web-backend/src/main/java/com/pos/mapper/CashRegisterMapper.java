package com.pos.mapper;

import com.pos.dto.cashregister.CashRegisterDetailResponse;
import com.pos.dto.cashregister.CashRegisterRowResponse;
import com.pos.entity.CashRegister;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface CashRegisterMapper {

    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "storeName", source = "store.name")
    CashRegisterRowResponse toRowResponse(CashRegister register);

    List<CashRegisterRowResponse> toRowResponseList(List<CashRegister> registers);

    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "storeName", source = "store.name")
    @Mapping(target = "storeAddress", source = "store.address")
    CashRegisterDetailResponse toDetailResponse(CashRegister register);
}
