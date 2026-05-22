package com.pos.domain;

import java.util.Set;

public enum WriteOffReason {
    DEFECT,
    EXPIRED,
    DAMAGE,
    SHORTAGE,
    OTHER;

    private static final Set<String> KEYS = Set.of(
        "DEFECT", "EXPIRED", "DAMAGE", "SHORTAGE", "OTHER"
    );

    public static WriteOffReason parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return OTHER;
        }
        String key = raw.trim().toUpperCase();
        if (!KEYS.contains(key)) {
            throw new IllegalArgumentException("Unknown write-off reason: " + raw);
        }
        return WriteOffReason.valueOf(key);
    }
}
