package com.pos.mapper;

import com.pos.dto.product.ProductResponse;
import com.pos.dto.product.ProductStorePriceRow;
import com.pos.entity.Product;
import com.pos.entity.ProductBarcode;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface ProductMapper {

    @Mapping(target = "categoryId", source = "product.category.id")
    @Mapping(target = "categoryName", source = "product.category.name")
    @Mapping(target = "lowStock", expression = "java(product.isLowStock())")
    @Mapping(target = "stockDispatched", constant = "0")
    @Mapping(target = "active", source = "product.active")
    @Mapping(target = "storesCount", source = "storesCount")
    @Mapping(target = "barcodes", source = "barcodes")
    @Mapping(target = "storePrices", source = "storePrices")
    @Mapping(target = "productType", source = "product.productType")
    @Mapping(target = "markedProduct", expression = "java(com.pos.service.product.ProductRetailFields.markedProduct(product))")
    @Mapping(target = "soldIndividually", expression = "java(com.pos.service.product.ProductRetailFields.soldIndividually(product))")
    @Mapping(target = "constructionDetails", ignore = true)
    @Mapping(target = "restaurantDetails", ignore = true)
    @Mapping(target = "serviceDetails", ignore = true)
    @Mapping(target = "retailExtras", ignore = true)
    ProductResponse toResponse(
        Product product,
        int storesCount,
        List<String> barcodes,
        List<ProductStorePriceRow> storePrices
    );

    default List<String> mergeBarcodes(Product product) {
        LinkedHashSet<String> set = new LinkedHashSet<>();
        if (product == null) {
            return List.of();
        }
        if (StringUtils.hasText(product.getBarcode())) {
            set.add(product.getBarcode().trim());
        }
        if (product.getExtraBarcodes() != null) {
            for (ProductBarcode barcode : product.getExtraBarcodes()) {
                if (StringUtils.hasText(barcode.getBarcode())) {
                    set.add(barcode.getBarcode().trim());
                }
            }
        }
        return Collections.unmodifiableList(new ArrayList<>(set));
    }
}
