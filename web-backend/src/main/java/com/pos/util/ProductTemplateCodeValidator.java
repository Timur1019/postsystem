package com.pos.util;

import com.pos.exception.BadRequestException;
import org.springframework.util.StringUtils;

import java.util.Set;

public final class ProductTemplateCodeValidator {

    private static final Set<String> VALID = Set.of(
        "BULK",
        "LENGTH",
        "MM_LENGTH",
        "LIQUID",
        "PIECE_CONSTRUCTION",
        "WEIGHT_GROCERY",
        "PIECE_GROCERY",
        "BEVERAGE",
        "FROZEN",
        "PIECE_RETAIL",
        "TILE",
        "PIECE_CLOTHING",
        "PIECE_PHARMACY",
        "DISH",
        "SERVICE"
    );

    private ProductTemplateCodeValidator() {}

    public static String normalizeOrNull(String code) {
        if (!StringUtils.hasText(code)) {
            return null;
        }
        String normalized = code.trim().toUpperCase();
        if (!VALID.contains(normalized)) {
            throw new BadRequestException("Unknown product template: " + code);
        }
        return normalized;
    }
}
