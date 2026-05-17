package com.pos.dto.report;

import java.math.BigDecimal;

public record DailyPoint(
    String date,
    BigDecimal revenue
) {}
