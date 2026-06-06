package com.pos.service.ai;

import com.pos.dto.report.SalesReportResponse;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

public final class AiAnalyticsMaps {

    private AiAnalyticsMaps() {
    }

    public static Map<String, Object> create() {
        return new LinkedHashMap<>();
    }

    public static BigDecimal money(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    public static Object safe(Object value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    public static Map<String, Object> salesBlock(SalesReportResponse sales) {
        Map<String, Object> block = create();
        block.put("revenue", money(sales.totalRevenue()));
        block.put("transactions", sales.transactionCount());
        block.put("averageCheck", money(sales.averageTransactionValue()));
        return block;
    }
}
