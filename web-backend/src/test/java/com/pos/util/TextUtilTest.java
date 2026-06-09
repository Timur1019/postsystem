package com.pos.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class TextUtilTest {

    @Test
    void trimOrNull_blank_returnsNull() {
        assertNull(TextUtil.trimOrNull("   "));
        assertNull(TextUtil.trimOrNull(null));
    }

    @Test
    void trimOrNull_text_returnsTrimmed() {
        assertEquals("abc", TextUtil.trimOrNull("  abc  "));
    }

    @Test
    void normalizeSearch_blank_returnsEmpty() {
        assertEquals("", TextUtil.normalizeSearch(null));
        assertEquals("", TextUtil.normalizeSearch("  "));
    }

    @Test
    void normalizeSearch_text_returnsTrimmed() {
        assertEquals("query", TextUtil.normalizeSearch("  query "));
    }
}
