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
    M,
    MM;

    public String displayLabel() {
        return switch (this) {
            case PCS -> "pcs";
            case KG -> "kg";
            case G -> "g";
            case L -> "l";
            case M -> "m";
            case MM -> "mm";
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
        if (u.equals("l") || u.equals("л") || u.contains("litre") || u.contains("liter") || u.contains("литр")) {
            return L;
        }
        if (u.equals("mm") || u.equals("мм") || u.contains("millimet")) {
            return MM;
        }
        if (u.equals("m") || u.equals("м") || u.contains("metre") || u.contains("meter") || u.contains("метр")) {
            return M;
        }
        if (u.equals("dona")
            || u.equals("шт")
            || u.equals("sh")
            || u.equals("pcs")
            || u.equals("pc")
            || u.equals("piece")
            || u.contains("упак")
            || u.contains("pachka")
            || u.contains("pack")) {
            return PCS;
        }
        return PCS;
    }
}
