package com.pos.util;

import org.springframework.util.StringUtils;

import java.text.Normalizer;
import java.util.Locale;

public final class CompanyLoginCodeUtil {

    private static final int MAX_LEN = 24;

    private CompanyLoginCodeUtil() {
    }

    public static String normalize(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "";
        }
        String s = raw.trim().toUpperCase(Locale.ROOT);
        s = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        s = s.replaceAll("[^A-Z0-9]+", "");
        if (s.length() > MAX_LEN) {
            s = s.substring(0, MAX_LEN);
        }
        return s;
    }

    public static String suggestFromName(String companyName) {
        String base = normalize(companyName);
        if (!StringUtils.hasText(base)) {
            return "";
        }
        if (base.length() < 3) {
            return base + "CO";
        }
        return base;
    }
}
