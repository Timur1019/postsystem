package com.pos.mapper;

import com.pos.dto.returns.ReturnRowResponse;
import com.pos.entity.Sale;
import com.pos.util.ReturnNotesSupport;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(config = PosMapperConfig.class)
public interface ReturnMapper {

    @Mapping(target = "id", source = "sale.id")
    @Mapping(target = "fiscalModuleId", source = "sale.receiptNumber")
    @Mapping(target = "positionsCount", source = "positionsCount")
    @Mapping(target = "storeName", source = "sale", qualifiedByName = "storeName")
    @Mapping(target = "cashierName", source = "sale.cashier.fullName")
    @Mapping(target = "reason", source = "sale", qualifiedByName = "reason")
    @Mapping(target = "status", source = "sale.status", qualifiedByName = "statusName")
    ReturnRowResponse toRowResponse(Sale sale, int positionsCount);

    @Named("storeName")
    default String storeName(Sale sale) {
        if (sale == null || sale.getStore() == null) {
            return "—";
        }
        String name = sale.getStore().getName();
        return name != null && !name.isBlank() ? name : "—";
    }

    @Named("reason")
    default String reason(Sale sale) {
        return sale == null ? "" : ReturnNotesSupport.extractReason(sale.getNotes());
    }

    @Named("statusName")
    default String statusName(Sale.SaleStatus status) {
        return status != null ? status.name() : null;
    }
}
