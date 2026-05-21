package com.pos.mapper;

import com.pos.dto.sale.SaleResponse;
import com.pos.entity.SaleItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.math.BigDecimal;
import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface SaleLineMapper {

    @Mapping(target = "returnableQuantity", source = "item", qualifiedByName = "returnableQty")
    @Mapping(target = "productName", source = "productName")
    @Mapping(target = "lineDiscount", source = "discount", qualifiedByName = "orZero")
    @Mapping(target = "taxAmount", source = "taxAmount", qualifiedByName = "orZero")
    @Mapping(target = "taxRatePercent", source = "item", qualifiedByName = "taxRate")
    @Mapping(target = "ikpu", source = "product.ikpu")
    @Mapping(target = "productSku", source = "product.sku")
    SaleResponse.SaleLineDto toLineDto(SaleItem item);

    List<SaleResponse.SaleLineDto> toLineDtoList(List<SaleItem> items);

    @Named("returnableQty")
    default int returnableQty(SaleItem item) {
        if (item == null) {
            return 0;
        }
        return Math.max(0, item.getQuantity() - item.getReturnedQuantity());
    }

    @Named("orZero")
    default BigDecimal orZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    @Named("taxRate")
    default BigDecimal taxRate(SaleItem item) {
        if (item == null || item.getProduct() == null || item.getProduct().getTaxRate() == null) {
            return new BigDecimal("12");
        }
        return item.getProduct().getTaxRate();
    }
}
