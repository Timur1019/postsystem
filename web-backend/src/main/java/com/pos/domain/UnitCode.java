package com.pos.domain;

import org.springframework.util.StringUtils;

/**
 * Единица учёта количества (логическая, не только подпись на чеке).
 */
public enum UnitCode {
    PCS,
    KG,
    G,
    L,
    M;

    public String displayLabel() {
        return switch (this) {
            case PCS -> "pcs";
            case KG -> "kg";
            case G -> "g";
            case L -> "l";
            case M -> "m";
        };
    }

    public static UnitCode fromUnitOfMeasure(String unitOfMeasure) {
        if (!StringUtils.hasText(unitOfMeasure)) {
            return null;
        }
        String u = unitOfMeasure.trim().toLowerCase();
        if (u.equals("kg") || u.equals("кг") || u.contains("kilogram")) {
            return KG;
        }
        if (u.equals("g") || u.equals("г") || u.equals("gram")) {
            return G;
        }
        if (u.equals("l") || u.equals("л") || u.contains("litre") || u.contains("liter")) {
            return L;
        }
        if (u.equals("m") || u.equals("м") || u.contains("metre") || u.contains("meter")) {
            return M;
        }
        return PCS;
    }
}
