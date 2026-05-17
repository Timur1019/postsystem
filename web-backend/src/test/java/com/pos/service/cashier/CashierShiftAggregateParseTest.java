package com.pos.service.cashier;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CashierShiftAggregateParseTest {

    @Test
    void unwrapsNestedNativeQueryRow() throws Exception {
        Object[] nested = new Object[] { 5L, new BigDecimal("1000.50"), BigDecimal.ZERO, BigDecimal.ZERO,
            new BigDecimal("600"), new BigDecimal("400.50") };
        Object[] wrapped = new Object[] { nested };

        Object[] row = invokeUnwrap(wrapped);
        assertEquals(5, invokeToInt(row[0]));
        assertEquals(new BigDecimal("1000.50"), invokeToBigDecimal(row[1]));
    }

    private static Object[] invokeUnwrap(Object[] raw) throws Exception {
        Method m = Class.forName("com.pos.service.cashier.impl.CashierShiftServiceImpl")
            .getDeclaredMethod("unwrapAggregateRow", Object[].class);
        m.setAccessible(true);
        return (Object[]) m.invoke(null, (Object) raw);
    }

    private static int invokeToInt(Object v) throws Exception {
        Method m = Class.forName("com.pos.service.cashier.impl.CashierShiftServiceImpl")
            .getDeclaredMethod("toInt", Object.class);
        m.setAccessible(true);
        return (int) m.invoke(null, v);
    }

    private static BigDecimal invokeToBigDecimal(Object v) throws Exception {
        Method m = Class.forName("com.pos.service.cashier.impl.CashierShiftServiceImpl")
            .getDeclaredMethod("toBigDecimal", Object.class);
        m.setAccessible(true);
        return (BigDecimal) m.invoke(null, v);
    }
}
