package com.pos.service.zreport;

import com.pos.dto.cashier.ShiftReportResponse;
import com.pos.entity.CashierShift;
import com.pos.entity.ZReport;

public interface ZReportFromShiftService {

    /**
     * Создаёт запись Z-отчёта для админки при закрытии смены кассира.
     */
    ZReport createForClosedShift(CashierShift shift, ShiftReportResponse report);

    /**
     * Создаёт Z-отчёты для уже закрытых смен, у которых их ещё нет.
     */
    int backfillMissingForClosedShifts();
}
