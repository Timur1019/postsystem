package com.pos.mapper;

import com.pos.dto.product.ProductStorePriceRow;
import com.pos.entity.ProductStorePrice;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface ProductStorePriceMapper {

    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "storeName", source = "store.name")
    ProductStorePriceRow toRow(ProductStorePrice storePrice);

    List<ProductStorePriceRow> toRowList(List<ProductStorePrice> storePrices);
}
