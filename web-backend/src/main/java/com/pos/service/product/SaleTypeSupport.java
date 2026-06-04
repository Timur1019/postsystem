package com.pos.service.product;

import com.pos.domain.SaleType;
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
            if (u.equals("kg") || u.equals("кг") || u.contains("kilogram")) {
                return SaleType.WEIGHT;
            }
        }
        return SaleType.PIECE;
    }

    public static String defaultUnitOfMeasure(SaleType saleType, String requested) {
        if (StringUtils.hasText(requested)) {
            return requested.trim();
        }
        return switch (saleType != null ? saleType : SaleType.PIECE) {
            case WEIGHT -> "kg";
            case SERVICE -> "pcs";
            default -> "pcs";
        };
    }
}
