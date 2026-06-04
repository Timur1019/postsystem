package com.pos.mapper;

import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import com.pos.dto.sale.SaleResponse;
import com.pos.entity.SaleItem;
import com.pos.util.QuantityUtil;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.math.BigDecimal;
import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface SaleLineMapper {

    @Mapping(target = "returnableQuantity", source = "item", qualifiedByName = "returnableQty")
    @Mapping(target = "productName", source = "productName")
    @Mapping(target = "saleType", source = "item", qualifiedByName = "saleTypeName")
    @Mapping(target = "unitOfMeasure", source = "item", qualifiedByName = "unitOfMeasure")
    @Mapping(target = "lineDiscount", source = "discount", qualifiedByName = "orZero")
    @Mapping(target = "taxAmount", source = "taxAmount", qualifiedByName = "orZero")
    @Mapping(target = "taxRatePercent", source = "item", qualifiedByName = "taxRate")
    @Mapping(target = "ikpu", source = "product.ikpu")
    @Mapping(target = "productSku", source = "product.sku")
    SaleResponse.SaleLineDto toLineDto(SaleItem item);

    List<SaleResponse.SaleLineDto> toLineDtoList(List<SaleItem> items);

    @Named("returnableQty")
    default BigDecimal returnableQty(SaleItem item) {
        if (item == null) {
            return BigDecimal.ZERO.setScale(QuantityUtil.SCALE);
        }
        BigDecimal left = QuantityUtil.subtract(item.getQuantity(), item.getReturnedQuantity());
        return left.signum() < 0 ? BigDecimal.ZERO.setScale(QuantityUtil.SCALE) : left;
    }

    @Named("saleTypeName")
    default String saleTypeName(SaleItem item) {
        if (item == null || item.getProduct() == null || item.getProduct().getSaleType() == null) {
            return SaleType.PIECE.name();
        }
        return item.getProduct().getSaleType().name();
    }

    @Named("unitOfMeasure")
    default String unitOfMeasure(SaleItem item) {
        if (item == null || item.getProduct() == null) {
            return null;
        }
        UnitCode unitCode = item.getProduct().getUnitCode();
        if (unitCode != null) {
            return unitCode.displayLabel();
        }
        String uom = item.getProduct().getUnitOfMeasure();
        return uom != null && !uom.isBlank() ? uom : "pcs";
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
