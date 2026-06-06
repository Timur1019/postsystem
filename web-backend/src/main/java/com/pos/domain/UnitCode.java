package com.pos.domain;

import org.springframework.util.StringUtils;

import java.math.BigDecimal;

/**
 * Код единицы учёта на товаре. Справочник labels/rules — таблица {@code units} + {@link com.pos.service.UnitCatalogService}.
 */
public enum UnitCode {
    PCS,
    KG,
    G,
    MG,
    M3,
    L,
    ML,
    KM,
    M,
    CM,
    MM,
    M2,
    CM2,
    PAIR,
    SET,
    PACK,
    BOX,
    ROLL,
    SHEET,
    HOUR,
    DAY;

    public String displayLabel() {
        return switch (this) {
            case PCS -> "шт";
            case KG -> "kg";
            case G -> "g";
            case MG -> "mg";
            case M3 -> "m³";
            case L -> "l";
            case ML -> "ml";
            case KM -> "km";
            case M -> "m";
            case CM -> "cm";
            case MM -> "mm";
            case M2 -> "m²";
            case CM2 -> "cm²";
            case PAIR -> "pair";
            case SET -> "set";
            case PACK -> "pack";
            case BOX -> "box";
            case ROLL -> "roll";
            case SHEET -> "sheet";
            case HOUR -> "h";
            case DAY -> "d";
        };
    }

    public static BigDecimal fallbackMinQuantity(UnitCode unitCode) {
        UnitCode unit = unitCode != null ? unitCode : KG;
        return switch (unit) {
            case G, MG, MM, CM, ML, CM2, PCS, PAIR, SET, PACK, BOX, ROLL, SHEET, HOUR, DAY -> BigDecimal.ONE;
            case L, M, M3, M2, KM -> new BigDecimal("0.001");
            default -> new BigDecimal("0.001");
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
        if (u.equals("mg") || u.equals("мг")) {
            return MG;
        }
        if (u.equals("t") || u.equals("т") || u.contains("ton")) {
            return KG;
        }
        if (u.equals("m3") || u.equals("м³") || u.contains("cubic")) {
            return M3;
        }
        if (u.equals("l") || u.equals("л") || u.contains("litre") || u.contains("liter") || u.contains("литр")) {
            return L;
        }
        if (u.equals("ml") || u.equals("мл")) {
            return ML;
        }
        if (u.equals("mm") || u.equals("мм") || u.contains("millimet")) {
            return MM;
        }
        if (u.equals("cm") || u.equals("см")) {
            return CM;
        }
        if (u.equals("km") || u.equals("км")) {
            return KM;
        }
        if (u.equals("m") || u.equals("м") || u.contains("metre") || u.contains("meter") || u.contains("метр")) {
            return M;
        }
        if (u.equals("m2") || u.equals("м²") || u.contains("sqm") || u.contains("кв")) {
            return M2;
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
