package com.pos.util;

import com.pos.domain.BusinessType;
import com.pos.exception.BadRequestException;
import org.springframework.util.StringUtils;

public final class BusinessTypeParser {

    private BusinessTypeParser() {}

    public static BusinessType parseRequired(String code) {
        if (!StringUtils.hasText(code)) {
            throw new BadRequestException("Business type is required");
        }
        return parseOrDefault(code, null);
    }

    public static BusinessType parseOrDefault(String code, BusinessType fallback) {
        if (!StringUtils.hasText(code)) {
            return fallback != null ? fallback : BusinessType.UNIVERSAL;
        }
        String normalized = code.trim().toUpperCase();
        if ("RETAIL".equals(normalized)) {
            return BusinessType.UNIVERSAL;
        }
        try {
            return BusinessType.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unknown business type: " + code);
        }
    }
}
