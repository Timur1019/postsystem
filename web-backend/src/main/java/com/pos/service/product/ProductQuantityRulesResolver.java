package com.pos.service.product;

import com.pos.domain.ProductQuantityRules;
import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import com.pos.entity.Product;
import org.springframework.util.StringUtils;

/**
 * Согласованные значения sale_type, unit_code, quantity_scale, allow_fraction.
 */
public final class ProductQuantityRulesResolver {

    public static final int MAX_QUANTITY_SCALE = 3;

    private ProductQuantityRulesResolver() {
    }

    public static ProductQuantityRules defaults(SaleType saleType) {
        return resolve(saleType, null, null, null, null);
    }

    public static ProductQuantityRules resolve(
        SaleType requestedSaleType,
        UnitCode requestedUnitCode,
        Integer requestedScale,
        Boolean requestedAllowFraction,
        String unitOfMeasure
    ) {
        SaleType saleType = SaleTypeSupport.resolve(requestedSaleType, unitOfMeasure);
        UnitCode unitCode = requestedUnitCode != null
            ? requestedUnitCode
            : inferUnitCode(saleType, unitOfMeasure);
        int scale = clampScale(
            requestedScale != null ? requestedScale : defaultScale(saleType, unitCode)
        );
        boolean allowFraction = requestedAllowFraction != null
            ? requestedAllowFraction
            : defaultAllowFraction(saleType);
        if (!allowFraction && scale > 0) {
            scale = 0;
        }
        if (allowFraction && saleType == SaleType.PIECE && scale == 0) {
            allowFraction = false;
        }
        return new ProductQuantityRules(saleType, unitCode, scale, allowFraction);
    }

    public static void applyTo(
        Product product,
        SaleType requestedSaleType,
        UnitCode requestedUnitCode,
        Integer requestedScale,
        Boolean requestedAllowFraction,
        String unitOfMeasure
    ) {
        ProductQuantityRules rules = resolve(
            requestedSaleType,
            requestedUnitCode,
            requestedScale,
            requestedAllowFraction,
            unitOfMeasure
        );
        product.setSaleType(rules.saleType());
        product.setUnitCode(rules.unitCode());
        product.setQuantityScale(rules.quantityScale());
        product.setAllowFraction(rules.allowFraction());
    }

    private static UnitCode inferUnitCode(SaleType saleType, String unitOfMeasure) {
        UnitCode fromUom = UnitCode.fromUnitOfMeasure(unitOfMeasure);
        if (fromUom != null && fromUom != UnitCode.PCS) {
            return fromUom;
        }
        return switch (saleType != null ? saleType : SaleType.PIECE) {
            case WEIGHT -> UnitCode.KG;
            default -> UnitCode.PCS;
        };
    }

    private static int defaultScale(SaleType saleType, UnitCode unitCode) {
        if (saleType == SaleType.WEIGHT) {
            return switch (unitCode != null ? unitCode : UnitCode.KG) {
                case G -> 0;
                default -> 3;
            };
        }
        return 0;
    }

    private static boolean defaultAllowFraction(SaleType saleType) {
        return saleType == SaleType.WEIGHT;
    }

    private static int clampScale(int scale) {
        return Math.max(0, Math.min(MAX_QUANTITY_SCALE, scale));
    }
}
