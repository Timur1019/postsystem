package com.pos.util;

public final class ReturnNotesSupport {

    private static final String VOID_MARKER = "VOID:";

    private ReturnNotesSupport() {}

    public static String extractReason(String notes) {
        if (notes == null || notes.isBlank()) {
            return "";
        }
        String upper = notes.toUpperCase();
        int idx = upper.indexOf(VOID_MARKER);
        if (idx < 0) {
            return notes.trim();
        }
        return notes.substring(idx + VOID_MARKER.length()).trim();
    }

    public static String withVoidReason(String previousNotes, String reason) {
        String r = reason != null ? reason.trim() : "";
        String voidPart = VOID_MARKER + " " + r;
        if (previousNotes == null || previousNotes.isBlank()) {
            return voidPart;
        }
        String withoutOldVoid = stripVoidSegment(previousNotes);
        if (withoutOldVoid.isBlank()) {
            return voidPart;
        }
        return withoutOldVoid + " | " + voidPart;
    }

    private static String stripVoidSegment(String notes) {
        int idx = notes.toUpperCase().indexOf(VOID_MARKER);
        if (idx < 0) {
            return notes.trim();
        }
        String before = notes.substring(0, idx).trim();
        if (before.endsWith("|")) {
            before = before.substring(0, before.length() - 1).trim();
        }
        return before;
    }
}
