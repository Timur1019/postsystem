package com.pos.util;

import com.pos.domain.ProductQuantityRules;
import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import com.pos.entity.Product;
import com.pos.exception.BadRequestException;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Валидация количества по правилам товара (хранение всегда DECIMAL 18,3).
 */
public final class QuantityValidator {

    public static final BigDecimal MIN_WEIGHT_KG = new BigDecimal("0.001");

    private QuantityValidator() {
    }

    public static void validate(Product product, BigDecimal rawQuantity) {
        validate(ProductQuantityRules.from(product), rawQuantity);
    }

    public static void validate(ProductQuantityRules rules, BigDecimal rawQuantity) {
        SaleType saleType = rules.saleType() != null ? rules.saleType() : SaleType.PIECE;
        BigDecimal q = normalizeForProduct(rules, rawQuantity);
        if (q.signum() <= 0) {
            throw new BadRequestException("Количество должно быть больше нуля");
        }
        if (!rules.allowFraction() && !matchesScale(q, 0)) {
            throw new BadRequestException("Для этого товара количество указывается целым числом");
        }
        if (!matchesScale(q, rules.quantityScale())) {
            throw new BadRequestException(
                "Количество допускает не более " + rules.quantityScale() + " знаков после запятой"
            );
        }
        switch (saleType) {
            case WEIGHT -> validateWeightMinimum(rules.unitCode(), q);
            case PIECE, SERVICE -> {
                if (!matchesScale(q, 0)) {
                    throw new BadRequestException(
                        saleType == SaleType.SERVICE
                            ? "Для услуги количество указывается целым числом"
                            : "Для штучного товара количество должно быть целым (1, 2, 3…)"
                    );
                }
            }
            default -> {
            }
        }
    }

    public static BigDecimal normalizeForProduct(ProductQuantityRules rules, BigDecimal quantity) {
        BigDecimal stored = QuantityUtil.normalize(quantity);
        return stored.setScale(rules.quantityScale(), RoundingMode.HALF_UP);
    }

    public static BigDecimal normalizeForProduct(Product product, BigDecimal quantity) {
        return normalizeForProduct(ProductQuantityRules.from(product), quantity);
    }

    private static void validateWeightMinimum(UnitCode unitCode, BigDecimal q) {
        UnitCode unit = unitCode != null ? unitCode : UnitCode.KG;
        BigDecimal min = switch (unit) {
            case G -> BigDecimal.ONE;
            case L, M -> new BigDecimal("0.001");
            default -> MIN_WEIGHT_KG;
        };
        if (q.compareTo(min) < 0) {
            throw new BadRequestException("Минимальное количество: " + min + " " + unit.displayLabel());
        }
    }

    static boolean matchesScale(BigDecimal q, int scale) {
        return q.setScale(scale, RoundingMode.HALF_UP).compareTo(q) == 0;
    }

    /** Целое число (для штук и услуг). */
    public static boolean isWholeUnit(BigDecimal q) {
        return q.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) == 0;
    }
}
