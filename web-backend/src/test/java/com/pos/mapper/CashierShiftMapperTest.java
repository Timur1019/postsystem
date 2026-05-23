package com.pos.mapper;

import com.pos.service.cashier.support.ShiftBannerAggregate;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class CashierShiftMapperTest {

    private final CashierShiftMapper mapper = new CashierShiftMapperImpl();

    @Test
    void unwrapsNestedNativeQueryRow() {
        Object[] nested = new Object[] {
            5L,
            new BigDecimal("1000.50"),
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            new BigDecimal("600"),
            new BigDecimal("400.50")
        };
        Object[] wrapped = new Object[] { nested };

        ShiftBannerAggregate aggregate = mapper.fromBannerRow(wrapped);

        assertThat(aggregate.saleCount()).isEqualTo(5);
        assertThat(aggregate.totalAmount()).isEqualByComparingTo("1000.50");
        assertThat(aggregate.cashAmount()).isEqualByComparingTo("600");
        assertThat(aggregate.cardAmount()).isEqualByComparingTo("400.50");
    }

    @Test
    void isEmptyBannerRow_detectsZeroAggregate() {
        Object[] row = new Object[] { 0L, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO };

        assertThat(mapper.isEmptyBannerRow(row)).isTrue();
    }
}
