package com.pos.service.sale.support;

import java.util.Optional;

public final class ReceiptLookupSupport {

    private ReceiptLookupSupport() {
    }

    public static String normalizeFullCode(String raw) {
        return raw.trim().replaceAll("\\s+", "").toUpperCase();
    }

    /**
     * Полный номер: RCP-20260607-0042, 20260607-0042 или 202606070042.
     */
    public static Optional<String> resolveExactReceiptNumber(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        String normalized = normalizeFullCode(raw);

        if (normalized.startsWith("RCP-")) {
            return Optional.of(normalized);
        }

        if (normalized.matches("\\d{8}-\\d+")) {
            int dash = normalized.indexOf('-');
            String date = normalized.substring(0, dash);
            String seq = formatSeq(normalized.substring(dash + 1));
            return Optional.of("RCP-" + date + "-" + seq);
        }

        String digits = normalized.replaceAll("\\D", "");
        if (digits.length() == 12) {
            return Optional.of(
                "RCP-" + digits.substring(0, 8) + "-" + formatSeq(digits.substring(8))
            );
        }

        return Optional.empty();
    }

    /** Короткий номер в конце чека: 42 → …-0042. */
    public static Optional<String> extractNumericSuffix(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        String digits = raw.trim().replaceAll("\\D", "");
        if (digits.isEmpty() || digits.length() > 4) {
            return Optional.empty();
        }
        try {
            return Optional.of(String.format("%04d", Long.parseLong(digits)));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private static String formatSeq(String seqDigits) {
        try {
            if (seqDigits.length() <= 4) {
                return String.format("%04d", Long.parseLong(seqDigits));
            }
            return seqDigits;
        } catch (NumberFormatException e) {
            return seqDigits;
        }
    }
}
