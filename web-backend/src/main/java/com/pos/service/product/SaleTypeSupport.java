package com.pos.service.product;

import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import org.springframework.util.StringUtils;

public final class SaleTypeSupport {

    private SaleTypeSupport() {
    }

    public static SaleType resolve(SaleType requested, String unitOfMeasure) {
        if (requested != null) {
            return requested;
        }
        if (StringUtils.hasText(unitOfMeasure)) {
            String u = unitOfMeasure.trim().toLowerCase();
            if (u.equals("service") || u.equals("услуга") || u.equals("xizmat")) {
                return SaleType.SERVICE;
            }
            UnitCode unitCode = UnitCode.fromUnitOfMeasure(unitOfMeasure);
            if (unitCode != null && unitCode != UnitCode.PCS) {
                return SaleType.WEIGHT;
            }
        }
        return SaleType.PIECE;
    }

    public static String defaultUnitOfMeasure(SaleType saleType, String requested) {
        if (StringUtils.hasText(requested)) {
            return requested.trim();
        }
        if (saleType == SaleType.WEIGHT) {
            return "kg";
        }
        if (saleType == SaleType.SERVICE) {
            return "pcs";
        }
        return "pcs";
    }

    public static String defaultUnitOfMeasure(SaleType saleType, UnitCode unitCode, String requested) {
        if (StringUtils.hasText(requested)) {
            return requested.trim();
        }
        if (unitCode != null && unitCode != UnitCode.PCS) {
            return unitCode.displayLabel();
        }
        return defaultUnitOfMeasure(saleType, requested);
    }
}
