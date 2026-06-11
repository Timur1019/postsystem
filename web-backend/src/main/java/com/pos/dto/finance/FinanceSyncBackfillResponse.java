package com.pos.dto.finance;

public record FinanceSyncBackfillResponse(
    int salesEnqueued,
    int purchasesEnqueued,
    int skipped
) {
}
