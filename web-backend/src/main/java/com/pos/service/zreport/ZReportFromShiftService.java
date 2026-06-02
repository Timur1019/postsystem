package com.pos.service.zreport;

import com.pos.dto.cashier.ShiftReportResponse;
import com.pos.entity.CashierShift;
import com.pos.entity.ZReport;

import java.time.Instant;

public interface ZReportFromShiftService {

    /**
     * Создаёт запись Z-отчёта для админки при закрытии смены кассира.
     */
    ZReport createForClosedShift(CashierShift shift, ShiftReportResponse report);

    /** Z внутри открытой смены (смена не закрывается, счётчики обнуляются с нового периода). */
    ZReport createForOpenShiftPeriod(CashierShift shift, ShiftReportResponse report, Instant periodFrom);

    /**
     * Создаёт Z-отчёты для уже закрытых смен, у которых их ещё нет.
     */
    int backfillMissingForClosedShifts(Integer companyId);
}
