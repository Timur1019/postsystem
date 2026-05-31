package com.pos.util;

import org.springframework.util.StringUtils;

import java.util.Locale;

public final class UserLoginUtil {

    private UserLoginUtil() {
    }

    public static String normalizeUsername(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "";
        }
        return raw.trim();
    }

    public static String normalizeEmail(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "";
        }
        return raw.trim().toLowerCase(Locale.ROOT);
    }
}
