package com.pos.util;

import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

public final class CashierPinUtil {

    private CashierPinUtil() {
    }

    public static String normalizePin(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "";
        }
        return raw.replaceAll("\\D+", "");
    }

    /** Deterministic digest to support lookup + uniqueness without storing PIN. */
    public static String digestHex(String pin, String secret) {
        String normalized = normalizePin(pin);
        if (!StringUtils.hasText(normalized)) {
            return "";
        }
        String key = StringUtils.hasText(secret) ? secret : "aurent-default-pin-secret";
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] out = mac.doFinal(normalized.getBytes(StandardCharsets.UTF_8));
            return toHex(out);
        } catch (Exception e) {
            throw new IllegalStateException("PIN digest failed", e);
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(Character.forDigit((b >>> 4) & 0xF, 16));
            sb.append(Character.forDigit(b & 0xF, 16));
        }
        return sb.toString();
    }
}

