package com.pos.mapper;

import com.pos.cache.analytics.DailySalesAggregate;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

class ReportAnalyticsMapperTest {

    private final ReportAnalyticsMapper mapper = new ReportAnalyticsMapperImpl();
    private final ZoneId zone = ZoneId.of("Asia/Tashkent");

    @Test
    void mergeItems_keepsRevenueAndSetsSoldQty() {
        LocalDate day = LocalDate.of(2026, 5, 1);
        DailySalesAggregate revenue = new DailySalesAggregate(day, BigDecimal.TEN, 2L, 0L, BigDecimal.ONE);
        DailySalesAggregate items = new DailySalesAggregate(day, BigDecimal.ZERO, 0L, 5L, BigDecimal.ZERO);

        DailySalesAggregate merged = mapper.mergeItems(revenue, items);

        assertThat(merged.revenue()).isEqualByComparingTo("10");
        assertThat(merged.transactionCount()).isEqualTo(2L);
        assertThat(merged.itemsSold()).isEqualTo(5L);
        assertThat(merged.costEstimate()).isEqualByComparingTo("1");
    }

    @Test
    void fromRevenueRow_mapsNativeAggregate() {
        Object[] row = { java.sql.Date.valueOf("2026-05-02"), new BigDecimal("100.50"), 3L };

        DailySalesAggregate agg = mapper.fromRevenueRow(row, zone);

        assertThat(agg.day()).isEqualTo(LocalDate.of(2026, 5, 2));
        assertThat(agg.revenue()).isEqualByComparingTo("100.50");
        assertThat(agg.transactionCount()).isEqualTo(3L);
    }
}
