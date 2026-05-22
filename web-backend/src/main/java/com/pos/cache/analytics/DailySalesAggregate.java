package com.pos.cache.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailySalesAggregate(
    LocalDate day,
    BigDecimal revenue,
    long transactionCount,
    long itemsSold,
    BigDecimal costEstimate
) {}
