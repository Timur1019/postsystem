package com.pos.dto.report;

import java.math.BigDecimal;

public record CashierStat(
    String cashierName,
    BigDecimal revenue
) {}
