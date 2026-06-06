package com.pos.mapper;

import com.pos.dto.sale.SaleResponse;
import com.pos.entity.Sale;
import org.hibernate.Hibernate;
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
    @Mapping(target = "cardType", source = "cardType", qualifiedByName = "enumName")
    @Mapping(target = "receiptType", source = "receiptType", qualifiedByName = "enumName")
    @Mapping(target = "status", source = "status", qualifiedByName = "enumName")
    @Mapping(target = "shiftId", source = "cashierShift.id")
    @Mapping(target = "shiftOpenedAt", source = "cashierShift.openedAt")
    @Mapping(target = "shiftClosedAt", source = "cashierShift.closedAt")
    @Mapping(target = "shiftStatus", source = "cashierShift.status", qualifiedByName = "enumName")
    @Mapping(target = "shiftZReportId", source = ".", qualifiedByName = "shiftZReportId")
    @Mapping(target = "items", source = "items")
    SaleResponse toResponse(Sale sale);

    @Mapping(target = "cashierName", source = "cashier.fullName")
    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "storeName", source = "store.name")
    @Mapping(target = "customerName", source = "customer.name")
    @Mapping(target = "returnAmount", source = ".", qualifiedByName = "returnAmount")
    @Mapping(target = "paymentMethod", source = "paymentMethod", qualifiedByName = "enumName")
    @Mapping(target = "cardType", source = "cardType", qualifiedByName = "enumName")
    @Mapping(target = "receiptType", source = "receiptType", qualifiedByName = "enumName")
    @Mapping(target = "status", source = "status", qualifiedByName = "enumName")
    @Mapping(target = "shiftId", source = "cashierShift.id")
    @Mapping(target = "shiftOpenedAt", source = "cashierShift.openedAt")
    @Mapping(target = "shiftClosedAt", source = "cashierShift.closedAt")
    @Mapping(target = "shiftStatus", source = "cashierShift.status", qualifiedByName = "enumName")
    @Mapping(target = "shiftZReportId", source = ".", qualifiedByName = "shiftZReportId")
    @Mapping(target = "items", expression = "java(java.util.List.of())")
    SaleResponse toSummaryResponse(Sale sale);

    @Named("enumName")
    default String enumName(Enum<?> value) {
        return value != null ? value.name() : null;
    }

    @Named("shiftZReportId")
    default Long shiftZReportId(Sale sale) {
        if (sale == null || sale.getCashierShift() == null || sale.getCashierShift().getZReport() == null) {
            return null;
        }
        return sale.getCashierShift().getZReport().getId();
    }

    @Named("returnAmount")
    default BigDecimal returnAmount(Sale sale) {
        if (sale == null || sale.getStatus() == null) {
            return BigDecimal.ZERO;
        }
        if (sale.getStatus() == Sale.SaleStatus.VOIDED) {
            return sale.getTotalAmount() != null ? sale.getTotalAmount() : BigDecimal.ZERO;
        }
        if (sale.getStatus() == Sale.SaleStatus.REFUNDED) {
            if (!Hibernate.isInitialized(sale.getItems())) {
                return BigDecimal.ZERO;
            }
            return com.pos.service.sale.impl.SalePartialReturnServiceImpl.totalReturnedAmount(sale);
        }
        return BigDecimal.ZERO;
    }
}
