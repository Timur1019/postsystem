package com.pos.service.finance;

import com.pos.dto.finance.FinanceSyncBackfillResponse;

import java.time.LocalDate;
import java.util.Set;

public interface FinanceSyncBackfillService {

    FinanceSyncBackfillResponse backfill(LocalDate from, LocalDate to, Set<String> types);
}
