package com.pos.mapper;

import com.pos.dto.sale.SaleResponse;
import com.pos.entity.Sale;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.math.BigDecimal;

@Mapper(config = PosMapperConfig.class, uses = SaleLineMapper.class)
public interface SaleMapper {

    @Mapping(target = "cashierName", source = "cashier.fullName")
    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "storeName", source = "store.name")
    @Mapping(target = "customerName", source = "customer.name")
    @Mapping(target = "returnAmount", source = ".", qualifiedByName = "returnAmount")
    @Mapping(target = "paymentMethod", source = "paymentMethod", qualifiedByName = "enumName")
    @Mapping(target = "receiptType", source = "receiptType", qualifiedByName = "enumName")
    @Mapping(target = "status", source = "status", qualifiedByName = "enumName")
    @Mapping(target = "items", source = "items")
    SaleResponse toResponse(Sale sale);

    @Mapping(target = "cashierName", source = "cashier.fullName")
    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "storeName", source = "store.name")
    @Mapping(target = "customerName", source = "customer.name")
    @Mapping(target = "returnAmount", source = ".", qualifiedByName = "returnAmount")
    @Mapping(target = "paymentMethod", source = "paymentMethod", qualifiedByName = "enumName")
    @Mapping(target = "receiptType", source = "receiptType", qualifiedByName = "enumName")
    @Mapping(target = "status", source = "status", qualifiedByName = "enumName")
    @Mapping(target = "items", expression = "java(java.util.List.of())")
    SaleResponse toSummaryResponse(Sale sale);

    @Named("enumName")
    default String enumName(Enum<?> value) {
        return value != null ? value.name() : null;
    }

    @Named("returnAmount")
    default BigDecimal returnAmount(Sale sale) {
        if (sale == null || sale.getStatus() == null) {
            return BigDecimal.ZERO;
        }
        if (sale.getStatus() == Sale.SaleStatus.VOIDED || sale.getStatus() == Sale.SaleStatus.REFUNDED) {
            return sale.getTotalAmount() != null ? sale.getTotalAmount() : BigDecimal.ZERO;
        }
        return BigDecimal.ZERO;
    }
}
