package com.pos.mapper;

import com.pos.dto.sale.SaleResponse;
import com.pos.entity.Sale;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(config = PosMapperConfig.class, uses = SaleLineMapper.class)
public interface SaleMapper {

    @Mapping(target = "cashierName", source = "cashier.fullName")
    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "storeName", source = "store.name")
    @Mapping(target = "customerName", source = "customer.name")
    @Mapping(target = "paymentMethod", source = "paymentMethod", qualifiedByName = "enumName")
    @Mapping(target = "receiptType", source = "receiptType", qualifiedByName = "enumName")
    @Mapping(target = "status", source = "status", qualifiedByName = "enumName")
    @Mapping(target = "items", source = "items")
    SaleResponse toResponse(Sale sale);

    @Mapping(target = "cashierName", source = "cashier.fullName")
    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "storeName", source = "store.name")
    @Mapping(target = "customerName", source = "customer.name")
    @Mapping(target = "paymentMethod", source = "paymentMethod", qualifiedByName = "enumName")
    @Mapping(target = "receiptType", source = "receiptType", qualifiedByName = "enumName")
    @Mapping(target = "status", source = "status", qualifiedByName = "enumName")
    @Mapping(target = "items", expression = "java(java.util.List.of())")
    SaleResponse toSummaryResponse(Sale sale);

    @Named("enumName")
    default String enumName(Enum<?> value) {
        return value != null ? value.name() : null;
    }
}
