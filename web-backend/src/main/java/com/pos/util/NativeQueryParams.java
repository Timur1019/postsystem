package com.pos.util;

import jakarta.persistence.Query;
import org.hibernate.query.NativeQuery;

public final class NativeQueryParams {

    private NativeQueryParams() {
    }

    public static void setNullableInteger(Query query, String name, Integer value) {
        query.unwrap(NativeQuery.class).setParameter(name, value, Integer.class);
    }
}
